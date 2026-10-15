from datetime import datetime
from pathlib import Path, PureWindowsPath
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import BACKEND_DIR, settings
from app.core.database import get_db
from app.dependencies import require_roles
from app.models.project import Project
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.team import Team
from app.models.user import User, UserRole
from app.schemas.submission import SubmissionResponse, SubmissionReview
from app.services.notification import create_notification


router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"],
)


# ponytail: local disk storage — fine for a single server; move to object storage before scaling out.
UPLOAD_DIR = BACKEND_DIR / "uploads" / "submissions"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt",
    ".txt", ".md", ".csv", ".png", ".jpg", ".jpeg", ".gif", ".zip",
}

# Reviewer decisions per current status. APPROVED and CHANGES_REQUESTED are final for
# that revision; a member responds to CHANGES_REQUESTED by submitting a new revision.
ALLOWED_TRANSITIONS = {
    SubmissionStatus.PENDING: {
        SubmissionStatus.IN_REVIEW,
        SubmissionStatus.APPROVED,
        SubmissionStatus.CHANGES_REQUESTED,
    },
    SubmissionStatus.IN_REVIEW: {
        SubmissionStatus.APPROVED,
        SubmissionStatus.CHANGES_REQUESTED,
    },
}

ACTIVE_STATUSES = (SubmissionStatus.PENDING, SubmissionStatus.IN_REVIEW)

MIN_CHANGE_REQUEST_LENGTH = 5


# ---------------------------------------------------------
# Access helpers
# ---------------------------------------------------------

def is_project_reviewer(project: Project, user: User) -> bool:
    """Admins, the project's manager, and the manager (lead) of the project's team."""
    if user.role == UserRole.ADMIN:
        return True
    if user.role != UserRole.MANAGER:
        return False
    return project.manager_id == user.id or project.team.manager_id == user.id


def _can_view(submission: Submission, user: User) -> bool:
    task = submission.task
    return (
        is_project_reviewer(task.project, user)
        or submission.submitted_by == user.id
        or task.assigned_to == user.id
    )


def _get_task_or_404(task_id: int, db: Session) -> Task:
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


def _get_visible_submission(submission_id: int, user: User, db: Session) -> Submission:
    submission = db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )
    if not _can_view(submission, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this submission",
        )
    return submission


def _reviewer_ids(project: Project) -> set[int]:
    return {project.manager_id, project.team.manager_id}


def _to_response(s: Submission) -> SubmissionResponse:
    return SubmissionResponse(
        id=s.id,
        task_id=s.task_id,
        task_title=s.task.title,
        project_id=s.task.project_id,
        project_name=s.task.project.name,
        submitted_by=s.submitted_by,
        submitter_name=s.submitter.name,
        version=s.version,
        comment=s.comment,
        github_url=s.github_url,
        has_file=bool(s.file_path),
        original_filename=s.original_filename,
        status=s.status,
        review_comment=s.review_comment,
        reviewed_by=s.reviewed_by,
        reviewer_name=s.reviewer.name if s.reviewer else None,
        submitted_at=s.submitted_at,
        reviewed_at=s.reviewed_at,
    )


def _validate_github_url(url: str) -> str:
    parsed = urlparse(url)
    parts = [p for p in parsed.path.split("/") if p]
    if (
        parsed.scheme != "https"
        or parsed.netloc.lower() not in ("github.com", "www.github.com")
        or len(parts) < 2
        or len(url) > 500
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub link must be an https://github.com/owner/repo URL (repo, commit, or pull request).",
        )
    return url


async def _save_upload(file: UploadFile) -> tuple[str, str]:
    """Validate and store an upload. Returns (stored_name, display_name)."""
    display_name = PureWindowsPath(file.filename or "").name.strip()[:255]
    extension = Path(display_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    contents = await file.read(max_bytes + 1)

    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File is larger than {settings.MAX_UPLOAD_MB} MB",
        )
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    stored_name = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / stored_name).write_bytes(contents)
    return stored_name, display_name


# ---------------------------------------------------------
# CREATE SUBMISSION / REVISION
# ---------------------------------------------------------
@router.post(
    "/task/{task_id}",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_work(
    task_id: int,
    file: UploadFile | None = File(None),
    comment: str | None = Form(None, max_length=2000),
    github_url: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
):
    task = _get_task_or_404(task_id, db)

    if task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit work for your own tasks",
        )

    comment = (comment or "").strip() or None
    github_url = (github_url or "").strip() or None
    has_file = file is not None and bool(file.filename)

    if not (comment or github_url or has_file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Add notes, a GitHub link, or a file to submit",
        )

    if github_url:
        _validate_github_url(github_url)

    latest = db.scalar(
        select(Submission)
        .where(Submission.task_id == task_id)
        .order_by(Submission.version.desc())
        .limit(1)
    )

    if latest and latest.status in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Your previous submission is still awaiting review",
        )
    if latest and latest.status == SubmissionStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This task's submission has already been approved",
        )

    stored_name, display_name = (await _save_upload(file)) if has_file else (None, None)

    submission = Submission(
        task_id=task_id,
        submitted_by=current_user.id,
        version=(latest.version + 1) if latest else 1,
        file_path=stored_name,
        original_filename=display_name,
        github_url=github_url,
        comment=comment,
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.utcnow(),
    )

    task.status = TaskStatus.IN_REVIEW
    db.add(submission)

    if submission.version > 1:
        notification_type = "RESUBMISSION_RECEIVED"
        message = f'{current_user.name} submitted revision {submission.version} for task "{task.title}".'
    else:
        notification_type = "SUBMISSION_RECEIVED"
        message = f'{current_user.name} submitted work for task "{task.title}".'

    for reviewer_id in _reviewer_ids(task.project) - {current_user.id}:
        create_notification(
            db=db,
            user_id=reviewer_id,
            notification_type=notification_type,
            message=message,
        )

    try:
        db.commit()
    except IntegrityError:
        # Another submission for this task won the race for the same version number.
        db.rollback()
        if stored_name:
            (UPLOAD_DIR / stored_name).unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission for this task was just created; refresh and try again",
        )
    except Exception:
        db.rollback()
        if stored_name:
            (UPLOAD_DIR / stored_name).unlink(missing_ok=True)
        raise

    db.refresh(submission)
    return _to_response(submission)


# ---------------------------------------------------------
# LIST SUBMISSIONS (review queue / my submissions)
# ---------------------------------------------------------
@router.get(
    "",
    response_model=list[SubmissionResponse],
)
def list_submissions(
    status_filter: SubmissionStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    stmt = select(Submission)

    if current_user.role == UserRole.MANAGER:
        stmt = (
            stmt.join(Task, Task.id == Submission.task_id)
            .join(Project, Project.id == Task.project_id)
            .join(Team, Team.id == Project.team_id)
            .where(or_(Project.manager_id == current_user.id, Team.manager_id == current_user.id))
        )
    elif current_user.role == UserRole.MEMBER:
        stmt = stmt.where(Submission.submitted_by == current_user.id)

    if status_filter is not None:
        stmt = stmt.where(Submission.status == status_filter)

    submissions = db.scalars(stmt.order_by(Submission.submitted_at.desc())).all()
    return [_to_response(s) for s in submissions]


# ---------------------------------------------------------
# SUBMISSION HISTORY FOR A TASK
# ---------------------------------------------------------
@router.get(
    "/task/{task_id}",
    response_model=list[SubmissionResponse],
)
def get_task_submissions(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    task = _get_task_or_404(task_id, db)

    if not (is_project_reviewer(task.project, current_user) or task.assigned_to == current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    submissions = db.scalars(
        select(Submission)
        .where(Submission.task_id == task_id)
        .order_by(Submission.version.desc())
    ).all()
    return [_to_response(s) for s in submissions]


# ---------------------------------------------------------
# SUBMISSION DETAIL
# ---------------------------------------------------------
@router.get(
    "/{submission_id}",
    response_model=SubmissionResponse,
)
def get_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    return _to_response(_get_visible_submission(submission_id, current_user, db))


# ---------------------------------------------------------
# DOWNLOAD ATTACHMENT
# ---------------------------------------------------------
@router.get("/{submission_id}/file")
def download_submission_file(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    submission = _get_visible_submission(submission_id, current_user, db)

    # Legacy rows stored a relative path; only the generated name is trusted.
    stored = UPLOAD_DIR / PureWindowsPath(submission.file_path or "").name
    if not submission.file_path or not stored.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file attached to this submission",
        )

    return FileResponse(
        stored,
        filename=submission.original_filename or stored.name,
        media_type="application/octet-stream",
        content_disposition_type="attachment",
        headers={"X-Content-Type-Options": "nosniff"},
    )


# ---------------------------------------------------------
# REVIEW (mark in review / approve / request changes)
# ---------------------------------------------------------
@router.patch(
    "/{submission_id}/review",
    response_model=SubmissionResponse,
)
def review_submission(
    submission_id: int,
    review_data: SubmissionReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    submission = db.get(Submission, submission_id)

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    task = submission.task

    if not is_project_reviewer(task.project, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review submissions for projects you manage or lead",
        )

    new_status = review_data.status
    current_status = submission.status

    if new_status not in ALLOWED_TRANSITIONS.get(current_status, set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot change a {current_status.value} submission to {new_status.value}",
        )

    review_comment = (review_data.review_comment or "").strip() or None

    if (
        new_status == SubmissionStatus.CHANGES_REQUESTED
        and len(review_comment or "") < MIN_CHANGE_REQUEST_LENGTH
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explain what needs to change when requesting changes",
        )

    values = {"status": new_status, "reviewed_by": current_user.id}
    if new_status != SubmissionStatus.IN_REVIEW:
        values["review_comment"] = review_comment
        values["reviewed_at"] = datetime.utcnow()

    # Conditional update so two reviewers acting at once cannot both win.
    result = db.execute(
        update(Submission)
        .where(Submission.id == submission.id, Submission.status == current_status)
        .values(**values)
    )
    if result.rowcount != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This submission was just reviewed by someone else; refresh to see the latest status",
        )

    if new_status == SubmissionStatus.APPROVED:
        task.status = TaskStatus.COMPLETED
        notification_type = "SUBMISSION_APPROVED"
        message = f'Your submission (v{submission.version}) for task "{task.title}" has been approved.'
    elif new_status == SubmissionStatus.CHANGES_REQUESTED:
        task.status = TaskStatus.IN_PROGRESS
        notification_type = "CHANGES_REQUESTED"
        message = f'Changes have been requested for your submission (v{submission.version}) to task "{task.title}".'
    else:
        notification_type = "SUBMISSION_IN_REVIEW"
        message = f'{current_user.name} started reviewing your submission for task "{task.title}".'

    if submission.submitted_by != current_user.id:
        create_notification(
            db=db,
            user_id=submission.submitted_by,
            notification_type=notification_type,
            message=message,
        )

    db.commit()
    db.refresh(submission)

    return _to_response(submission)
