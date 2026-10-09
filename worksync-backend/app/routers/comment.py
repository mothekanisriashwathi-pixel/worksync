
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_roles
from app.models.comment import Comment
from app.models.project import Project
from app.models.task import Task
from app.models.user import User, UserRole
from app.schemas.comment import CommentCreate, CommentResponse
from app.services.notification import create_notification


router = APIRouter(
    prefix="/comments",
    tags=["Comments"],
)


def can_access_task(
    task: Task,
    current_user: User,
    db: Session,
) -> bool:
    if current_user.role == UserRole.ADMIN:
        return True

    if current_user.role == UserRole.MANAGER:
        project = db.get(Project, task.project_id)
        return project is not None and project.manager_id == current_user.id

    return task.assigned_to == current_user.id


@router.get(
    "/task/{task_id}",
    response_model=list[CommentResponse],
)
def get_task_comments(
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

    if not can_access_task(task, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    return db.scalars(
        select(Comment)
        .where(Comment.task_id == task_id)
        .order_by(Comment.created_at)
    ).all()


@router.post(
    "/task/{task_id}",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    task_id: int,
    comment_data: CommentCreate,
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

    if not can_access_task(task, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=comment_data.content,
    )

    db.add(comment)

    # Notify the relevant other participant.
    project = db.get(Project, task.project_id)

    if current_user.role == UserRole.MEMBER:
        recipient_id = project.manager_id if project else None
    else:
        recipient_id = task.assigned_to

    if recipient_id is not None and recipient_id != current_user.id:
        create_notification(
            db=db,
            user_id=recipient_id,
            notification_type="NEW_COMMENT",
            message=f'{current_user.name} commented on task "{task.title}".',
        )

    db.commit()
    db.refresh(comment)

    return comment
