from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    team_id: int
    manager_id: int
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: date | None = None
    due_date: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    status: ProjectStatus | None = None
    start_date: date | None = None
    due_date: date | None = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    team_id: int
    manager_id: int
    status: ProjectStatus
    start_date: date | None
    due_date: date | None