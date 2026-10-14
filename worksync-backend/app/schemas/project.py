from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    team_id: int
    manager_id: int | None = None
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: date | None = None
    due_date: date | None = None
    github_repo_url: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=150)
    description: str | None = None
    status: ProjectStatus | None = None
    start_date: date | None = None
    due_date: date | None = None
    github_repo_url: str | None = None


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
    github_repo_url: str | None = None


# ---------------------------------------------------------------------------
# GitHub Schemas
# ---------------------------------------------------------------------------

class GitHubLinkRequest(BaseModel):
    github_repo_url: str = Field(..., description="Public GitHub repository URL, e.g. https://github.com/owner/repo")


class GitHubRepoInfo(BaseModel):
    owner: str
    repo: str
    name: str
    full_name: str
    description: str | None = None
    default_branch: str = "main"
    language: str | None = None
    stars_count: int = 0
    forks_count: int = 0
    html_url: str


class GitHubCommitInfo(BaseModel):
    sha: str
    short_sha: str
    message: str
    author_name: str
    author_date: str
    html_url: str
    avatar_url: str | None = None