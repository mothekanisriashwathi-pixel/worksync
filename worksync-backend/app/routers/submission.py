from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_roles
from app.models.project import Project
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskStatus
from app.models.user import User, UserRole
from app.schemas.submission import SubmissionResponse, SubmissionReview
from app.services.notification import create_notification


router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"],
)


UPLOAD_DIR = Path("uploads/submissions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/task/{task_id}",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_work(
    task_id: int,
    file: UploadFile = File(...),
    comment: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.MEMBER)),
):
    task = db.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit work for your own tasks",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A file is required",
        )

    extension = Path(file.filename).suffix
    stored_filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / stored_filename

    contents = await file.read()
    file_path.write_bytes(contents)

    submission = Submission(
        task_id=task_id,
        submitted_by=current_user.id,
        file_path=str(file_path),
        comment=comment,
        status=SubmissionStatus.PENDING,
        submitted_at=datetime.utcnow(),
    )

    task.status = TaskStatus.IN_REVIEW
    db.add(submission)

    project = db.get(Project, task.project_id)

    if project and project.manager_id != current_user.id:
        create_notification(
            db=db,
            user_id=project.manager_id,
            notification_type="SUBMISSION_RECEIVED",
            message=f'{current_user.name} submitted work for task "{task.title}".',
        )

    db.commit()
    db.refresh(submission)

    return submission


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
    task = db.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if current_user.role == UserRole.MEMBER:
        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this task",
            )

    elif current_user.role == UserRole.MANAGER:
        project = db.get(Project, task.project_id)

        if not project or project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this task",
            )

    return db.scalars(
        select(Submission)
        .where(Submission.task_id == task_id)
        .order_by(Submission.submitted_at.desc())
    ).all()


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

    task = db.get(Task, submission.task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    if current_user.role == UserRole.MANAGER:
        project = db.get(Project, task.project_id)

        if not project or project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review submissions for your own projects",
            )

    if review_data.status not in (
        SubmissionStatus.APPROVED,
        SubmissionStatus.CHANGES_REQUESTED,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review status must be APPROVED or CHANGES_REQUESTED",
        )

    submission.status = review_data.status
    submission.review_comment = review_data.review_comment
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.utcnow()

    if review_data.status == SubmissionStatus.APPROVED:
        task.status = TaskStatus.COMPLETED
        notification_type = "SUBMISSION_APPROVED"
        message = f'Your submission for task "{task.title}" has been approved.'
    else:
        task.status = TaskStatus.IN_PROGRESS
        notification_type = "CHANGES_REQUESTED"
        message = f'Changes have been requested for your submission to task "{task.title}".'

    if submission.submitted_by != current_user.id:
        create_notification(
            db=db,
            user_id=submission.submitted_by,
            notification_type=notification_type,
            message=message,
        )

    db.commit()
    db.refresh(submission)

    return submission
