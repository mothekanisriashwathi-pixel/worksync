from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_roles
from app.models.project import Project
from app.models.team import Team, TeamMember
from app.models.user import User, UserRole
from app.schemas.project import (
    GitHubCommitInfo,
    GitHubLinkRequest,
    GitHubRepoInfo,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.github import (
    fetch_github_commits,
    fetch_github_repo_info,
    normalize_github_url,
    validate_and_parse_github_url,
)

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


def _check_project_access(project: Project, user: User, db: Session) -> None:
    """Verify that user has read access to the project."""
    if user.role == UserRole.ADMIN:
        return

    if user.role == UserRole.MANAGER:
        if project.manager_id == user.id:
            return
        team = db.get(Team, project.team_id)
        if team and team.manager_id == user.id:
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project",
        )

    # Member: check team membership
    membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == project.team_id,
            TeamMember.user_id == user.id,
        )
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this project",
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
    else:
        if project_data.manager_id is not None:
            manager = db.get(User, project_data.manager_id)
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
            manager_id = manager.id
        else:
            manager_id = team.manager_id

    repo_url = None
    if project_data.github_repo_url:
        repo_url = normalize_github_url(project_data.github_repo_url)

    project = Project(
        name=project_data.name,
        description=project_data.description,
        team_id=project_data.team_id,
        manager_id=manager_id,
        status=project_data.status,
        start_date=project_data.start_date,
        due_date=project_data.due_date,
        github_repo_url=repo_url,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


# ---------------------------------------------------------
# GET PROJECT BY ID
# ---------------------------------------------------------
@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    _check_project_access(project, current_user, db)
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
    project = db.get(Project, project_id)
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
            detail="You can only update your own projects",
        )

    update_data = project_data.model_dump(exclude_unset=True)

    if "github_repo_url" in update_data:
        if update_data["github_repo_url"]:
            update_data["github_repo_url"] = normalize_github_url(update_data["github_repo_url"])
        else:
            update_data["github_repo_url"] = None

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return project


# ---------------------------------------------------------
# DELETE PROJECT
# ---------------------------------------------------------
@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    project = db.get(Project, project_id)
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
            detail="You can only delete your own projects",
        )

    db.delete(project)
    db.commit()


# ---------------------------------------------------------
# GITHUB INTEGRATION ENDPOINTS
# ---------------------------------------------------------

@router.post(
    "/{project_id}/github",
    response_model=ProjectResponse,
    summary="Link or update a public GitHub repository for a project",
)
async def link_project_github(
    project_id: int,
    link_data: GitHubLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    project = db.get(Project, project_id)
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
            detail="You can only manage GitHub integration for your own projects",
        )

    owner, repo = validate_and_parse_github_url(link_data.github_repo_url)

    # Verify that the repository exists on GitHub
    await fetch_github_repo_info(owner, repo)

    normalized_url = normalize_github_url(link_data.github_repo_url)
    project.github_repo_url = normalized_url

    db.commit()
    db.refresh(project)
    return project


@router.delete(
    "/{project_id}/github",
    response_model=ProjectResponse,
    summary="Unlink GitHub repository from a project",
)
def unlink_project_github(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    project = db.get(Project, project_id)
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
            detail="You can only manage GitHub integration for your own projects",
        )

    project.github_repo_url = None
    db.commit()
    db.refresh(project)
    return project


@router.get(
    "/{project_id}/github/repo",
    response_model=GitHubRepoInfo,
    summary="Get live GitHub repository metadata for a project",
)
async def get_project_github_repo(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    _check_project_access(project, current_user, db)

    if not project.github_repo_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No GitHub repository is linked to this project.",
        )

    owner, repo = validate_and_parse_github_url(project.github_repo_url)
    return await fetch_github_repo_info(owner, repo)


@router.get(
    "/{project_id}/github/commits",
    response_model=list[GitHubCommitInfo],
    summary="Get live recent commits from linked GitHub repository",
)
async def get_project_github_commits(
    project_id: int,
    per_page: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    _check_project_access(project, current_user, db)

    if not project.github_repo_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No GitHub repository is linked to this project.",
        )

    owner, repo = validate_and_parse_github_url(project.github_repo_url)
    return await fetch_github_commits(owner, repo, per_page=per_page)