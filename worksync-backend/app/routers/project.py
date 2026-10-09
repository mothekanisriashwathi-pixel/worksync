from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_roles
from app.models.project import Project
from app.models.team import Team, TeamMember
from app.models.user import User, UserRole
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


# ---------------------------------------------------------
# GET PROJECTS
# ---------------------------------------------------------
@router.get(
    "",
    response_model=list[ProjectResponse],
)
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    # Admin can see all projects
    if current_user.role == UserRole.ADMIN:
        return db.scalars(
            select(Project)
            .order_by(Project.id)
        ).all()

    # Manager can see projects they manage
    if current_user.role == UserRole.MANAGER:
        return db.scalars(
            select(Project)
            .where(
                Project.manager_id == current_user.id
            )
            .order_by(Project.id)
        ).all()

    # Member can see projects belonging to their teams
    return db.scalars(
        select(Project)
        .join(
            TeamMember,
            TeamMember.team_id == Project.team_id,
        )
        .where(
            TeamMember.user_id == current_user.id
        )
        .distinct()
        .order_by(Project.id)
    ).all()


# ---------------------------------------------------------
# CREATE PROJECT
# ---------------------------------------------------------
@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    team = db.get(
        Team,
        project_data.team_id,
    )

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Manager can only create projects for their own team
    if current_user.role == UserRole.MANAGER:
        if team.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create projects for your own team",
            )

        manager_id = current_user.id

    # Admin can create a project for a selected manager
    else:
        manager = db.get(
            User,
            project_data.manager_id,
        )

        if not manager:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Manager not found",
            )

        if manager.role != UserRole.MANAGER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected user is not a manager",
            )

        if team.manager_id != manager.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Selected manager does not manage this team",
            )

        manager_id = manager.id

    project = Project(
        name=project_data.name,
        description=project_data.description,
        team_id=project_data.team_id,
        manager_id=manager_id,
        status=project_data.status,
        start_date=project_data.start_date,
        due_date=project_data.due_date,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


# ---------------------------------------------------------
# UPDATE PROJECT
# ---------------------------------------------------------
@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    project = db.get(
        Project,
        project_id,
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Manager can only update their own projects
    if (
        current_user.role == UserRole.MANAGER
        and project.manager_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own projects",
        )

    update_data = project_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            project,
            field,
            value,
        )

    db.commit()
    db.refresh(project)

    return project