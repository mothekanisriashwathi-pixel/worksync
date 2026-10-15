from typing import Any
from pydantic import BaseModel


class MetricCardData(BaseModel):
    key: str
    label: str
    value: int | str
    trend: str | None = None
    icon: str | None = None
    color: str | None = None


class ProjectDashboardItem(BaseModel):
    id: int
    name: str
    team_name: str | None = None
    status: str
    progress: int
    tasks_total: int
    tasks_done: int
    overdue_tasks: int
    health: str  # "On Track" | "At Risk" | "Delayed" | "Completed"
    due_date: str | None = None
    github_repo_url: str | None = None


class TaskDashboardItem(BaseModel):
    id: int
    title: str
    project_id: int
    project_name: str | None = None
    assigned_to: int
    assignee_name: str | None = None
    status: str
    priority: str
    due_date: str | None = None
    is_overdue: bool = False


class TeamMemberWorkload(BaseModel):
    user_id: int
    name: str
    email: str
    open_tasks: int
    in_progress: int
    in_review: int
    completed: int
    total_tasks: int


class PendingReviewItem(BaseModel):
    id: int
    task_id: int
    task_title: str
    project_name: str | None = None
    submitted_by_id: int
    submitter_name: str
    status: str
    version: int
    comment: str | None = None
    submitted_at: str


class ActivityDashboardItem(BaseModel):
    id: int
    actor: str
    action: str
    target: str
    time: str
    type: str


class DashboardSummaryResponse(BaseModel):
    role: str
    active_view: str
    allowed_views: list[str]
    user_name: str
    greeting: str
    subtitle: str
    date_display: str
    metrics: list[MetricCardData]
    task_status_distribution: dict[str, int]
    projects: list[ProjectDashboardItem]
    tasks: list[TaskDashboardItem]
    team_workload: list[TeamMemberWorkload]
    pending_reviews: list[PendingReviewItem]
    recent_activity: list[ActivityDashboardItem]
    platform_overview: dict[str, Any] | None = None
    upcoming_deadlines: list[TaskDashboardItem]
