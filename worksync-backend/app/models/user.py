from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    MEMBER = "MEMBER"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.MEMBER,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Teams managed by this user
    managed_teams = relationship(
        "Team",
        foreign_keys="Team.manager_id",
        back_populates="manager",
    )

    # Team memberships
    team_memberships = relationship(
        "TeamMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Projects managed by this user
    projects_managed = relationship(
        "Project",
        foreign_keys="Project.manager_id",
        back_populates="manager",
    )

    # Tasks assigned to this user
    tasks_assigned = relationship(
        "Task",
        foreign_keys="Task.assigned_to",
        back_populates="assigned_user",
    )

    # Tasks created by this user
    tasks_created = relationship(
        "Task",
        foreign_keys="Task.created_by",
        back_populates="creator",
    )

    # Comments written by this user
    comments = relationship(
        "Comment",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # Submissions made by this user
    submissions = relationship(
        "Submission",
        foreign_keys="Submission.submitted_by",
        back_populates="submitter",
    )

    # Submissions reviewed by this user
    reviewed_submissions = relationship(
        "Submission",
        foreign_keys="Submission.reviewed_by",
        back_populates="reviewer",
    )

    # Notifications for this user
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
    )