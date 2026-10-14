from datetime import datetime, timedelta, timezone, date
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.project import Project, ProjectStatus
from app.models.submission import Submission, SubmissionStatus
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.team import Team, TeamMember
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    ActivityDashboardItem,
    DashboardSummaryResponse,
    MetricCardData,
    PendingReviewItem,
    ProjectDashboardItem,
    TaskDashboardItem,
    TeamMemberWorkload,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _calculate_project_health(project: Project, total_tasks: int, done_tasks: int, overdue_tasks: int) -> str:
    if project.status == ProjectStatus.COMPLETED:
        return "Completed"
    
    today = date.today()
    progress = round((done_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    if overdue_tasks > 0 and project.due_date and project.due_date < today:
        return "Delayed"
    
    days_to_due = (project.due_date - today).days if project.due_date else 999
    if overdue_tasks > 0 or (days_to_due <= 7 and progress < 50):
        return "At Risk"
    
    return "On Track"


def _format_time_ago(dt: datetime | None) -> str:
    if not dt:
        return "recently"
    now = datetime.utcnow()
    diff = (now - dt).total_seconds()
    if diff < 60:
        return "just now"
    if diff < 3600:
        return f"{int(diff // 60)} min ago"
    if diff < 86400:
        return f"{int(diff // 3600)} hr ago"
    return f"{int(diff // 86400)} days ago"


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    view: str | None = Query(default=None, description="Requested dashboard role view"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Role-based, database-backed summary for WorkSync dashboards.
    Enforces authorization:
    - MEMBER can only see 'member' view.
    - MANAGER can see 'manager', 'team_lead', or 'member' view.
    - ADMIN can see 'admin', 'manager', 'team_lead', or 'member' view.
    """
    # 1. Determine allowed views and active view
    if current_user.role == UserRole.ADMIN:
        allowed_views = ["admin", "manager", "team_lead", "member"]
        default_view = "admin"
    elif current_user.role == UserRole.MANAGER:
        allowed_views = ["manager", "team_lead", "member"]
        default_view = "manager"
    else:
        allowed_views = ["member"]
        default_view = "member"

    requested_view = (view.lower() if view else default_view).strip()

    if requested_view not in allowed_views:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to access the '{requested_view}' dashboard view.",
        )

    now = datetime.utcnow()
    today = date.today()
    week_ago = now - timedelta(days=7)
    date_display = datetime.now().strftime("%A, %B %d, %Y")

    # Helper maps for lookups
    user_lookup = {u.id: u.name for u in db.query(User.id, User.name).all()}
    project_lookup = {p.id: (p.name, p.team_id) for p in db.query(Project.id, Project.name, Project.team_id).all()}
    team_lookup = {t.id: t.name for t in db.query(Team.id, Team.name).all()}

    # ─────────────────────────────────────────────────────────────────────────
    # A. MEMBER VIEW
    # ─────────────────────────────────────────────────────────────────────────
    if requested_view == "member":
        # Tasks assigned to user
        my_tasks = (
            db.query(Task)
            .filter(Task.assigned_to == current_user.id)
            .order_by(Task.due_date.asc())
            .all()
        )

        my_open_tasks = [t for t in my_tasks if t.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS)]
        tasks_in_progress = [t for t in my_tasks if t.status == TaskStatus.IN_PROGRESS]
        tasks_awaiting_review = [t for t in my_tasks if t.status == TaskStatus.IN_REVIEW]
        completed_this_week = [
            t for t in my_tasks
            if t.status == TaskStatus.COMPLETED and t.updated_at and t.updated_at >= week_ago
        ]

        metrics = [
            MetricCardData(
                key="open_tasks",
                label="My Open Tasks",
                value=len(my_open_tasks),
                icon="tasks",
                color="primary",
            ),
            MetricCardData(
                key="in_progress",
                label="Tasks In Progress",
                value=len(tasks_in_progress),
                icon="progress",
                color="info",
            ),
            MetricCardData(
                key="awaiting_review",
                label="Tasks Awaiting Review",
                value=len(tasks_awaiting_review),
                icon="warning",
                color="warning",
            ),
            MetricCardData(
                key="completed_week",
                label="Completed This Week",
                value=len(completed_this_week),
                icon="check",
                color="success",
            ),
        ]

        task_status_distribution = {
            "todo": sum(1 for t in my_tasks if t.status == TaskStatus.TODO),
            "in_progress": len(tasks_in_progress),
            "in_review": len(tasks_awaiting_review),
            "completed": sum(1 for t in my_tasks if t.status == TaskStatus.COMPLETED),
        }

        # Projects user belongs to (via team membership or assigned tasks)
        my_team_ids = [
            tm.team_id
            for tm in db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
        ]
        my_project_ids = set(t.project_id for t in my_tasks)
        projects_query = (
            db.query(Project)
            .filter((Project.team_id.in_(my_team_ids)) | (Project.id.in_(my_project_ids)))
            .all()
        )

        projects_list: list[ProjectDashboardItem] = []
        for p in projects_query:
            p_tasks = db.query(Task).filter(Task.project_id == p.id).all()
            t_total = len(p_tasks)
            t_done = sum(1 for pt in p_tasks if pt.status == TaskStatus.COMPLETED)
            t_overdue = sum(1 for pt in p_tasks if pt.due_date and pt.due_date < now and pt.status != TaskStatus.COMPLETED)
            prog = round((t_done / t_total) * 100) if t_total > 0 else 0
            health = _calculate_project_health(p, t_total, t_done, t_overdue)
            projects_list.append(
                ProjectDashboardItem(
                    id=p.id,
                    name=p.name,
                    team_name=team_lookup.get(p.team_id),
                    status=p.status.value,
                    progress=prog,
                    tasks_total=t_total,
                    tasks_done=t_done,
                    overdue_tasks=t_overdue,
                    health=health,
                    due_date=str(p.due_date) if p.due_date else None,
                    github_repo_url=p.github_repo_url,
                )
            )

        # Prioritized task items
        tasks_list: list[TaskDashboardItem] = []
        for t in my_tasks:
            is_overdue = bool(t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED)
            p_info = project_lookup.get(t.project_id, ("Project", None))
            tasks_list.append(
                TaskDashboardItem(
                    id=t.id,
                    title=t.title,
                    project_id=t.project_id,
                    project_name=p_info[0],
                    assigned_to=t.assigned_to,
                    assignee_name=user_lookup.get(t.assigned_to, "You"),
                    status=t.status.value,
                    priority=t.priority.value,
                    due_date=t.due_date.isoformat() if t.due_date else None,
                    is_overdue=is_overdue,
                )
            )

        upcoming_deadlines = [
            t for t in tasks_list if t.due_date and t.status != "COMPLETED"
        ]

        # Recent activity from notifications
        notifs = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(10)
            .all()
        )
        activity_list = [
            ActivityDashboardItem(
                id=n.id,
                actor="WorkSync",
                action="notified you:",
                target=n.message,
                time=_format_time_ago(n.created_at),
                type=n.type.value if hasattr(n.type, "value") else str(n.type),
            )
            for n in notifs
        ]

        return DashboardSummaryResponse(
            role=current_user.role.value,
            active_view="member",
            allowed_views=allowed_views,
            user_name=current_user.name,
            greeting=f"Good day, {current_user.name}",
            subtitle="Here is an overview of your active assignments and upcoming milestones.",
            date_display=date_display,
            metrics=metrics,
            task_status_distribution=task_status_distribution,
            projects=projects_list,
            tasks=tasks_list,
            team_workload=[],
            pending_reviews=[],
            recent_activity=activity_list,
            platform_overview=None,
            upcoming_deadlines=upcoming_deadlines,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # B. TEAM LEAD VIEW
    # ─────────────────────────────────────────────────────────────────────────
    elif requested_view == "team_lead":
        # Scoped to teams managed by user (or all teams for admin)
        if current_user.role == UserRole.ADMIN:
            lead_teams = db.query(Team).all()
        else:
            lead_teams = db.query(Team).filter(Team.manager_id == current_user.id).all()

        lead_team_ids = [t.id for t in lead_teams]
        team_projects = (
            db.query(Project).filter(Project.team_id.in_(lead_team_ids)).all()
            if lead_team_ids else []
        )
        team_project_ids = [p.id for p in team_projects]

        team_tasks = (
            db.query(Task).filter(Task.project_id.in_(team_project_ids)).all()
            if team_project_ids else []
        )

        active_projects_count = sum(
            1 for p in team_projects if p.status not in (ProjectStatus.COMPLETED, ProjectStatus.ON_HOLD)
        )
        tasks_overdue_count = sum(
            1 for t in team_tasks if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED
        )
        tasks_awaiting_review = sum(1 for t in team_tasks if t.status == TaskStatus.IN_REVIEW)

        metrics = [
            MetricCardData(
                key="active_projects",
                label="Active Projects",
                value=active_projects_count,
                icon="projects",
                color="primary",
            ),
            MetricCardData(
                key="total_team_tasks",
                label="Total Team Tasks",
                value=len(team_tasks),
                icon="tasks",
                color="info",
            ),
            MetricCardData(
                key="tasks_overdue",
                label="Tasks Overdue",
                value=tasks_overdue_count,
                icon="warning",
                color="danger",
            ),
            MetricCardData(
                key="tasks_in_review",
                label="Awaiting Review",
                value=tasks_awaiting_review,
                icon="check",
                color="warning",
            ),
        ]

        task_status_distribution = {
            "todo": sum(1 for t in team_tasks if t.status == TaskStatus.TODO),
            "in_progress": sum(1 for t in team_tasks if t.status == TaskStatus.IN_PROGRESS),
            "in_review": tasks_awaiting_review,
            "completed": sum(1 for t in team_tasks if t.status == TaskStatus.COMPLETED),
        }

        # Team Workload calculation
        team_members_query = (
            db.query(User)
            .join(TeamMember, TeamMember.user_id == User.id)
            .filter(TeamMember.team_id.in_(lead_team_ids))
            .distinct()
            .all()
            if lead_team_ids else []
        )

        workload_list: list[TeamMemberWorkload] = []
        for m in team_members_query:
            m_tasks = [t for t in team_tasks if t.assigned_to == m.id]
            open_c = sum(1 for t in m_tasks if t.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS))
            prog_c = sum(1 for t in m_tasks if t.status == TaskStatus.IN_PROGRESS)
            rev_c = sum(1 for t in m_tasks if t.status == TaskStatus.IN_REVIEW)
            comp_c = sum(1 for t in m_tasks if t.status == TaskStatus.COMPLETED)
            workload_list.append(
                TeamMemberWorkload(
                    user_id=m.id,
                    name=m.name,
                    email=m.email,
                    open_tasks=open_c,
                    in_progress=prog_c,
                    in_review=rev_c,
                    completed=comp_c,
                    total_tasks=len(m_tasks),
                )
            )

        # Projects list
        projects_list: list[ProjectDashboardItem] = []
        for p in team_projects:
            p_tasks = [t for t in team_tasks if t.project_id == p.id]
            t_total = len(p_tasks)
            t_done = sum(1 for pt in p_tasks if pt.status == TaskStatus.COMPLETED)
            t_overdue = sum(1 for pt in p_tasks if pt.due_date and pt.due_date < now and pt.status != TaskStatus.COMPLETED)
            prog = round((t_done / t_total) * 100) if t_total > 0 else 0
            health = _calculate_project_health(p, t_total, t_done, t_overdue)
            projects_list.append(
                ProjectDashboardItem(
                    id=p.id,
                    name=p.name,
                    team_name=team_lookup.get(p.team_id),
                    status=p.status.value,
                    progress=prog,
                    tasks_total=t_total,
                    tasks_done=t_done,
                    overdue_tasks=t_overdue,
                    health=health,
                    due_date=str(p.due_date) if p.due_date else None,
                    github_repo_url=p.github_repo_url,
                )
            )

        # Pending Reviews
        pending_subs = (
            db.query(Submission)
            .join(Task, Task.id == Submission.task_id)
            .filter(Task.project_id.in_(team_project_ids), Submission.status == SubmissionStatus.PENDING)
            .order_by(Submission.submitted_at.desc())
            .all()
            if team_project_ids else []
        )
        task_title_map = {t.id: (t.title, project_lookup.get(t.project_id, ("", None))[0]) for t in team_tasks}
        reviews_list = [
            PendingReviewItem(
                id=s.id,
                task_id=s.task_id,
                task_title=task_title_map.get(s.task_id, ("Task", ""))[0],
                project_name=task_title_map.get(s.task_id, ("", "Project"))[1],
                submitted_by_id=s.submitted_by,
                submitter_name=user_lookup.get(s.submitted_by, "Team Member"),
                file_path=s.file_path,
                comment=s.comment,
                submitted_at=s.submitted_at.isoformat() if s.submitted_at else now.isoformat(),
            )
            for s in pending_subs
        ]

        # Upcoming Deadlines across team tasks
        upcoming_deadlines: list[TaskDashboardItem] = []
        for t in sorted(team_tasks, key=lambda x: x.due_date or datetime.max):
            if t.due_date and t.status != TaskStatus.COMPLETED:
                p_info = project_lookup.get(t.project_id, ("Project", None))
                upcoming_deadlines.append(
                    TaskDashboardItem(
                        id=t.id,
                        title=t.title,
                        project_id=t.project_id,
                        project_name=p_info[0],
                        assigned_to=t.assigned_to,
                        assignee_name=user_lookup.get(t.assigned_to, "Unassigned"),
                        status=t.status.value,
                        priority=t.priority.value,
                        due_date=t.due_date.isoformat(),
                        is_overdue=bool(t.due_date < now),
                    )
                )

        # Recent Activity
        notifs = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(10)
            .all()
        )
        activity_list = [
            ActivityDashboardItem(
                id=n.id,
                actor="Team Activity",
                action="update:",
                target=n.message,
                time=_format_time_ago(n.created_at),
                type=n.type.value if hasattr(n.type, "value") else str(n.type),
            )
            for n in notifs
        ]

        return DashboardSummaryResponse(
            role=current_user.role.value,
            active_view="team_lead",
            allowed_views=allowed_views,
            user_name=current_user.name,
            greeting=f"Team Overview — {current_user.name}",
            subtitle="Coordinate sprints, monitor workload distribution, and review pending deliverables.",
            date_display=date_display,
            metrics=metrics,
            task_status_distribution=task_status_distribution,
            projects=projects_list,
            tasks=upcoming_deadlines[:15],
            team_workload=workload_list,
            pending_reviews=reviews_list,
            recent_activity=activity_list,
            platform_overview=None,
            upcoming_deadlines=upcoming_deadlines[:10],
        )

    # ─────────────────────────────────────────────────────────────────────────
    # C. PROJECT MANAGER VIEW
    # ─────────────────────────────────────────────────────────────────────────
    elif requested_view == "manager":
        # Scoped to projects managed by user (or all projects for admin)
        if current_user.role == UserRole.ADMIN:
            managed_projects = db.query(Project).all()
        else:
            managed_projects = db.query(Project).filter(Project.manager_id == current_user.id).all()

        managed_project_ids = [p.id for p in managed_projects]
        managed_tasks = (
            db.query(Task).filter(Task.project_id.in_(managed_project_ids)).all()
            if managed_project_ids else []
        )

        projects_list: list[ProjectDashboardItem] = []
        on_track_count = 0
        at_risk_count = 0
        overdue_tasks_total = 0

        for p in managed_projects:
            p_tasks = [t for t in managed_tasks if t.project_id == p.id]
            t_total = len(p_tasks)
            t_done = sum(1 for pt in p_tasks if pt.status == TaskStatus.COMPLETED)
            t_overdue = sum(1 for pt in p_tasks if pt.due_date and pt.due_date < now and pt.status != TaskStatus.COMPLETED)
            overdue_tasks_total += t_overdue
            prog = round((t_done / t_total) * 100) if t_total > 0 else 0
            health = _calculate_project_health(p, t_total, t_done, t_overdue)

            if health in ("On Track", "Completed"):
                on_track_count += 1
            else:
                at_risk_count += 1

            projects_list.append(
                ProjectDashboardItem(
                    id=p.id,
                    name=p.name,
                    team_name=team_lookup.get(p.team_id),
                    status=p.status.value,
                    progress=prog,
                    tasks_total=t_total,
                    tasks_done=t_done,
                    overdue_tasks=t_overdue,
                    health=health,
                    due_date=str(p.due_date) if p.due_date else None,
                    github_repo_url=p.github_repo_url,
                )
            )

        metrics = [
            MetricCardData(
                key="projects_managed",
                label="Projects Managed",
                value=len(managed_projects),
                icon="projects",
                color="primary",
            ),
            MetricCardData(
                key="projects_on_track",
                label="Projects On Track",
                value=on_track_count,
                icon="check",
                color="success",
            ),
            MetricCardData(
                key="projects_at_risk",
                label="Projects At Risk",
                value=at_risk_count,
                icon="warning",
                color="warning",
            ),
            MetricCardData(
                key="overdue_tasks",
                label="Overdue Tasks",
                value=overdue_tasks_total,
                icon="tasks",
                color="danger",
            ),
        ]

        task_status_distribution = {
            "todo": sum(1 for t in managed_tasks if t.status == TaskStatus.TODO),
            "in_progress": sum(1 for t in managed_tasks if t.status == TaskStatus.IN_PROGRESS),
            "in_review": sum(1 for t in managed_tasks if t.status == TaskStatus.IN_REVIEW),
            "completed": sum(1 for t in managed_tasks if t.status == TaskStatus.COMPLETED),
        }

        # Workload across managed projects
        assignee_ids = list(set(t.assigned_to for t in managed_tasks))
        assignees = db.query(User).filter(User.id.in_(assignee_ids)).all() if assignee_ids else []
        workload_list = []
        for m in assignees:
            m_tasks = [t for t in managed_tasks if t.assigned_to == m.id]
            open_c = sum(1 for t in m_tasks if t.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS))
            prog_c = sum(1 for t in m_tasks if t.status == TaskStatus.IN_PROGRESS)
            rev_c = sum(1 for t in m_tasks if t.status == TaskStatus.IN_REVIEW)
            comp_c = sum(1 for t in m_tasks if t.status == TaskStatus.COMPLETED)
            workload_list.append(
                TeamMemberWorkload(
                    user_id=m.id,
                    name=m.name,
                    email=m.email,
                    open_tasks=open_c,
                    in_progress=prog_c,
                    in_review=rev_c,
                    completed=comp_c,
                    total_tasks=len(m_tasks),
                )
            )

        # Pending Approvals
        pending_subs = (
            db.query(Submission)
            .join(Task, Task.id == Submission.task_id)
            .filter(Task.project_id.in_(managed_project_ids), Submission.status == SubmissionStatus.PENDING)
            .order_by(Submission.submitted_at.desc())
            .all()
            if managed_project_ids else []
        )
        task_title_map = {t.id: (t.title, project_lookup.get(t.project_id, ("", None))[0]) for t in managed_tasks}
        reviews_list = [
            PendingReviewItem(
                id=s.id,
                task_id=s.task_id,
                task_title=task_title_map.get(s.task_id, ("Task", ""))[0],
                project_name=task_title_map.get(s.task_id, ("", "Project"))[1],
                submitted_by_id=s.submitted_by,
                submitter_name=user_lookup.get(s.submitted_by, "Team Member"),
                file_path=s.file_path,
                comment=s.comment,
                submitted_at=s.submitted_at.isoformat() if s.submitted_at else now.isoformat(),
            )
            for s in pending_subs
        ]

        upcoming_deadlines: list[TaskDashboardItem] = []
        for t in sorted(managed_tasks, key=lambda x: x.due_date or datetime.max):
            if t.due_date and t.status != TaskStatus.COMPLETED:
                p_info = project_lookup.get(t.project_id, ("Project", None))
                upcoming_deadlines.append(
                    TaskDashboardItem(
                        id=t.id,
                        title=t.title,
                        project_id=t.project_id,
                        project_name=p_info[0],
                        assigned_to=t.assigned_to,
                        assignee_name=user_lookup.get(t.assigned_to, "Unassigned"),
                        status=t.status.value,
                        priority=t.priority.value,
                        due_date=t.due_date.isoformat(),
                        is_overdue=bool(t.due_date < now),
                    )
                )

        notifs = (
            db.query(Notification)
            .filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
            .limit(10)
            .all()
        )
        activity_list = [
            ActivityDashboardItem(
                id=n.id,
                actor="Project Activity",
                action="update:",
                target=n.message,
                time=_format_time_ago(n.created_at),
                type=n.type.value if hasattr(n.type, "value") else str(n.type),
            )
            for n in notifs
        ]

        return DashboardSummaryResponse(
            role=current_user.role.value,
            active_view="manager",
            allowed_views=allowed_views,
            user_name=current_user.name,
            greeting=f"Project Management Overview — {current_user.name}",
            subtitle="Executive delivery metrics, resource utilization, and portfolio risk management.",
            date_display=date_display,
            metrics=metrics,
            task_status_distribution=task_status_distribution,
            projects=projects_list,
            tasks=upcoming_deadlines[:15],
            team_workload=workload_list,
            pending_reviews=reviews_list,
            recent_activity=activity_list,
            platform_overview=None,
            upcoming_deadlines=upcoming_deadlines[:10],
        )

    # ─────────────────────────────────────────────────────────────────────────
    # D. ADMIN VIEW
    # ─────────────────────────────────────────────────────────────────────────
    elif requested_view == "admin":
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_projects = db.query(func.count(Project.id)).scalar() or 0
        active_projects = (
            db.query(func.count(Project.id))
            .filter(Project.status.notin_([ProjectStatus.COMPLETED, ProjectStatus.ON_HOLD]))
            .scalar()
            or 0
        )
        total_teams = db.query(func.count(Team.id)).scalar() or 0

        # Tasks requiring attention
        tasks_attention = (
            db.query(func.count(Task.id))
            .filter(
                (Task.status == TaskStatus.IN_REVIEW)
                | ((Task.due_date < now) & (Task.status != TaskStatus.COMPLETED))
            )
            .scalar()
            or 0
        )

        metrics = [
            MetricCardData(
                key="total_users",
                label="Total Users",
                value=total_users,
                icon="team",
                color="primary",
            ),
            MetricCardData(
                key="active_projects",
                label="Active Projects",
                value=active_projects,
                icon="projects",
                color="info",
            ),
            MetricCardData(
                key="total_teams",
                label="Total Teams",
                value=total_teams,
                icon="team",
                color="warning",
            ),
            MetricCardData(
                key="tasks_attention",
                label="Tasks Requiring Attention",
                value=tasks_attention,
                icon="warning",
                color="danger",
            ),
        ]

        # User distribution by role
        user_dist = {
            "ADMIN": db.query(func.count(User.id)).filter(User.role == UserRole.ADMIN).scalar() or 0,
            "MANAGER": db.query(func.count(User.id)).filter(User.role == UserRole.MANAGER).scalar() or 0,
            "MEMBER": db.query(func.count(User.id)).filter(User.role == UserRole.MEMBER).scalar() or 0,
        }

        all_tasks = db.query(Task).all()
        task_status_distribution = {
            "todo": sum(1 for t in all_tasks if t.status == TaskStatus.TODO),
            "in_progress": sum(1 for t in all_tasks if t.status == TaskStatus.IN_PROGRESS),
            "in_review": sum(1 for t in all_tasks if t.status == TaskStatus.IN_REVIEW),
            "completed": sum(1 for t in all_tasks if t.status == TaskStatus.COMPLETED),
        }

        task_health = {
            "completed": task_status_distribution["completed"],
            "in_progress": task_status_distribution["in_progress"],
            "in_review": task_status_distribution["in_review"],
            "overdue": sum(1 for t in all_tasks if t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED),
            "todo": task_status_distribution["todo"],
        }

        all_projects = db.query(Project).all()
        projects_list: list[ProjectDashboardItem] = []
        for p in all_projects:
            p_tasks = [t for t in all_tasks if t.project_id == p.id]
            t_total = len(p_tasks)
            t_done = sum(1 for pt in p_tasks if pt.status == TaskStatus.COMPLETED)
            t_overdue = sum(1 for pt in p_tasks if pt.due_date and pt.due_date < now and pt.status != TaskStatus.COMPLETED)
            prog = round((t_done / t_total) * 100) if t_total > 0 else 0
            health = _calculate_project_health(p, t_total, t_done, t_overdue)
            projects_list.append(
                ProjectDashboardItem(
                    id=p.id,
                    name=p.name,
                    team_name=team_lookup.get(p.team_id),
                    status=p.status.value,
                    progress=prog,
                    tasks_total=t_total,
                    tasks_done=t_done,
                    overdue_tasks=t_overdue,
                    health=health,
                    due_date=str(p.due_date) if p.due_date else None,
                    github_repo_url=p.github_repo_url,
                )
            )

        # High priority / attention tasks
        attention_tasks: list[TaskDashboardItem] = []
        for t in all_tasks:
            is_overdue = bool(t.due_date and t.due_date < now and t.status != TaskStatus.COMPLETED)
            if is_overdue or t.status == TaskStatus.IN_REVIEW or t.priority in (TaskPriority.URGENT, TaskPriority.HIGH):
                p_info = project_lookup.get(t.project_id, ("Project", None))
                attention_tasks.append(
                    TaskDashboardItem(
                        id=t.id,
                        title=t.title,
                        project_id=t.project_id,
                        project_name=p_info[0],
                        assigned_to=t.assigned_to,
                        assignee_name=user_lookup.get(t.assigned_to, "Unassigned"),
                        status=t.status.value,
                        priority=t.priority.value,
                        due_date=t.due_date.isoformat() if t.due_date else None,
                        is_overdue=is_overdue,
                    )
                )

        # Pending reviews system-wide
        pending_subs = (
            db.query(Submission)
            .filter(Submission.status == SubmissionStatus.PENDING)
            .order_by(Submission.submitted_at.desc())
            .limit(10)
            .all()
        )
        reviews_list = [
            PendingReviewItem(
                id=s.id,
                task_id=s.task_id,
                task_title=user_lookup.get(s.task_id, f"Task #{s.task_id}"),
                project_name=None,
                submitted_by_id=s.submitted_by,
                submitter_name=user_lookup.get(s.submitted_by, "User"),
                file_path=s.file_path,
                comment=s.comment,
                submitted_at=s.submitted_at.isoformat() if s.submitted_at else now.isoformat(),
            )
            for s in pending_subs
        ]

        notifs = (
            db.query(Notification)
            .order_by(Notification.created_at.desc())
            .limit(10)
            .all()
        )
        activity_list = [
            ActivityDashboardItem(
                id=n.id,
                actor="System Audit",
                action="event:",
                target=n.message,
                time=_format_time_ago(n.created_at),
                type=n.type.value if hasattr(n.type, "value") else str(n.type),
            )
            for n in notifs
        ]

        return DashboardSummaryResponse(
            role=current_user.role.value,
            active_view="admin",
            allowed_views=allowed_views,
            user_name=current_user.name,
            greeting=f"Administration Overview — {current_user.name}",
            subtitle="Platform-wide governance, system metrics, and cross-team health monitoring.",
            date_display=date_display,
            metrics=metrics,
            task_status_distribution=task_status_distribution,
            projects=projects_list,
            tasks=attention_tasks[:15],
            team_workload=[],
            pending_reviews=reviews_list,
            recent_activity=activity_list,
            platform_overview={
                "total_users": total_users,
                "total_projects": total_projects,
                "active_projects": active_projects,
                "total_teams": total_teams,
                "user_distribution": user_dist,
                "task_health": task_health,
            },
            upcoming_deadlines=attention_tasks[:10],
        )

    raise HTTPException(status_code=400, detail="Invalid view requested.")
