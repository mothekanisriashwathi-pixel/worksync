
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_roles
from app.models.project import Project
from app.models.task import Task
from app.models.team import TeamMember
from app.models.user import User, UserRole
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.notification import create_notification


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


@router.get(
    "",
    response_model=list[TaskResponse],
)
def get_tasks(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    if current_user.role == UserRole.ADMIN:
        stmt = select(Task)
        if project_id is not None:
            stmt = stmt.where(Task.project_id == project_id)
        return db.scalars(stmt.order_by(Task.id)).all()

    if current_user.role == UserRole.MANAGER:
        stmt = (
            select(Task)
            .join(Project, Task.project_id == Project.id)
            .where(Project.manager_id == current_user.id)
        )
        if project_id is not None:
            stmt = stmt.where(Task.project_id == project_id)
        return db.scalars(stmt.order_by(Task.id)).all()

    # Member: tasks in projects belonging to teams they are part of
    if project_id is not None:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found",
            )
        membership = db.scalar(
            select(TeamMember).where(
                TeamMember.team_id == project.team_id,
                TeamMember.user_id == current_user.id,
            )
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project",
            )
        return db.scalars(
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.id)
        ).all()

    return db.scalars(
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .join(TeamMember, TeamMember.team_id == Project.team_id)
        .where(TeamMember.user_id == current_user.id)
        .distinct()
        .order_by(Task.id)
    ).all()


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    project = db.get(Project, task_data.project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if (
        current_user.role == UserRole.MANAGER
        and project.manager_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create tasks for your own projects",
        )

    assigned_user = db.get(User, task_data.assigned_to)

    if not assigned_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found",
        )

    if assigned_user.role != UserRole.MEMBER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasks can only be assigned to team members",
        )

    membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == project.team_id,
            TeamMember.user_id == task_data.assigned_to,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user is not a member of the project team",
        )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        project_id=task_data.project_id,
        assigned_to=task_data.assigned_to,
        created_by=current_user.id,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.due_date,
    )

    db.add(task)

    create_notification(
        db=db,
        user_id=assigned_user.id,
        notification_type="TASK_ASSIGNED",
        message=f'You have been assigned a new task: "{task.title}".',
    )

    db.commit()
    db.refresh(task)

    return task


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
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

    project = db.get(Project, task.project_id)

    if current_user.role == UserRole.MANAGER:
        if project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update tasks in your own projects",
            )

    elif current_user.role == UserRole.MEMBER:
        if task.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own tasks",
            )

        allowed_fields = {"status", "description"}
        update_data = task_data.model_dump(exclude_unset=True)

        if any(field not in allowed_fields for field in update_data):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only update task status and description",
            )
    else:
        update_data = task_data.model_dump(exclude_unset=True)

    if current_user.role != UserRole.MEMBER:
        update_data = task_data.model_dump(exclude_unset=True)

    # Validate a new assignee before changing the task.
    new_assignee = None

    if "assigned_to" in update_data:
        new_assignee = db.get(User, update_data["assigned_to"])

        if not new_assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found",
            )

        if new_assignee.role != UserRole.MEMBER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tasks can only be assigned to team members",
            )

        membership = db.scalar(
            select(TeamMember).where(
                TeamMember.team_id == project.team_id,
                TeamMember.user_id == new_assignee.id,
            )
        )

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of the project team",
            )

    previous_assignee_id = task.assigned_to

    for field, value in update_data.items():
        setattr(task, field, value)

    # Notify only when the task is assigned to a different member.
    if (
        new_assignee is not None
        and new_assignee.id != previous_assignee_id
    ):
        create_notification(
            db=db,
            user_id=new_assignee.id,
            notification_type="TASK_ASSIGNED",
            message=f'You have been assigned a task: "{task.title}".',
        )

    db.commit()
    db.refresh(task)

    return task


# ---------------------------------------------------------
# GET TASK BY ID
# ---------------------------------------------------------
@router.get(
    "/{task_id}",
    response_model=TaskResponse,
)
def get_task(
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

    if current_user.role == UserRole.ADMIN:
        return task

    project = db.get(Project, task.project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if current_user.role == UserRole.MANAGER:
        if project.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this task",
            )
        return task

    # Member: check if assigned or member of the project team
    if task.assigned_to == current_user.id:
        return task

    membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == project.team_id,
            TeamMember.user_id == current_user.id,
        )
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this task",
        )

    return task


# ---------------------------------------------------------
# DELETE TASK
# ---------------------------------------------------------
@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    task = db.get(Task, task_id)
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
                detail="You can only delete tasks in your own projects",
            )

    db.delete(task)
    db.commit()
