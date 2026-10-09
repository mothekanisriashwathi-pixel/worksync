from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_roles
from app.models.team import Team, TeamMember
from app.models.user import User, UserRole
from app.schemas.team import (
    TeamCreate,
    TeamMemberAdd,
    TeamMemberResponse,
    TeamResponse,
    TeamUpdate,
)


router = APIRouter(
    prefix="/teams",
    tags=["Teams"],
)


# ---------------------------------------------------------
# GET TEAMS
# ---------------------------------------------------------
@router.get(
    "",
    response_model=list[TeamResponse],
)
def get_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    # Admin can see all teams
    if current_user.role == UserRole.ADMIN:
        return db.scalars(
            select(Team).order_by(Team.id)
        ).all()

    # Manager can see teams they manage
    if current_user.role == UserRole.MANAGER:
        return db.scalars(
            select(Team)
            .where(Team.manager_id == current_user.id)
            .order_by(Team.id)
        ).all()

    # Member can see teams they belong to
    return db.scalars(
        select(Team)
        .join(
            TeamMember,
            TeamMember.team_id == Team.id,
        )
        .where(
            TeamMember.user_id == current_user.id
        )
        .order_by(Team.id)
    ).all()


# ---------------------------------------------------------
# GET TEAM MEMBERS
# ---------------------------------------------------------
@router.get(
    "/{team_id}/members",
    response_model=list[TeamMemberResponse],
)
def get_team_members(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.MEMBER,
        )
    ),
):
    team = db.get(Team, team_id)

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    # Admin can view any team's members
    if current_user.role == UserRole.ADMIN:
        pass

    # Manager can only view their own team's members
    elif current_user.role == UserRole.MANAGER:
        if team.manager_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this team",
            )

    # Member can only view members of their own team
    elif current_user.role == UserRole.MEMBER:
        membership = db.scalar(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == current_user.id,
            )
        )

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this team",
            )

    return db.scalars(
        select(TeamMember)
        .where(
            TeamMember.team_id == team_id
        )
        .order_by(TeamMember.user_id)
    ).all()


# ---------------------------------------------------------
# CREATE TEAM
# ---------------------------------------------------------
@router.post(
    "",
    response_model=TeamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_team(
    team_data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    manager = db.get(
        User,
        team_data.manager_id,
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

    team = Team(
        name=team_data.name,
        description=team_data.description,
        manager_id=team_data.manager_id,
    )

    db.add(team)
    db.commit()
    db.refresh(team)

    return team


# ---------------------------------------------------------
# UPDATE TEAM
# ---------------------------------------------------------
@router.patch(
    "/{team_id}",
    response_model=TeamResponse,
)
def update_team(
    team_id: int,
    team_data: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    team = db.get(
        Team,
        team_id,
    )

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    if team_data.manager_id is not None:
        manager = db.get(
            User,
            team_data.manager_id,
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

    update_data = team_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            team,
            field,
            value,
        )

    db.commit()
    db.refresh(team)

    return team


# ---------------------------------------------------------
# ADD TEAM MEMBER
# ---------------------------------------------------------
@router.post(
    "/{team_id}/members",
    response_model=TeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_team_member(
    team_id: int,
    member_data: TeamMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    team = db.get(
        Team,
        team_id,
    )

    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )

    user = db.get(
        User,
        member_data.user_id,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    existing_membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == member_data.user_id,
        )
    )

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already a member of this team",
        )

    membership = TeamMember(
        team_id=team_id,
        user_id=member_data.user_id,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return membership


# ---------------------------------------------------------
# REMOVE TEAM MEMBER
# ---------------------------------------------------------
@router.delete(
    "/{team_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found",
        )

    db.delete(membership)
    db.commit()