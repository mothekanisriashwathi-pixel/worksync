/**
 * Dashboard — connected to real API data.
 *
 * Data sources (all role-scoped by the backend):
 *   GET /tasks         → TaskResponse[]
 *   GET /projects      → ProjectResponse[]
 *   GET /notifications → NotificationResponse[]
 *
 * What is derived client-side (no dedicated endpoint exists):
 *   - project_name on tasks   (looked up from projects by project_id)
 *   - progress / tasksTotal / tasksDone on projects (counted from tasks)
 *   - overdue flag            (due_date < today)
 *   - dueDate display string  (formatted from ISO date)
 *   - deadlineNear            (due_date within 14 days)
 *   - stat card counts        (counted from tasks / projects arrays)
 *   - task status chart data  (counted from tasks)
 *   - activity feed           (built from notifications)
 *   - assignee name           (not in TaskResponse — shows "—" until a
 *                              /users endpoint is consumed in a later phase)
 */
import { useEffect, useState } from 'react'

import StatCard       from '../../components/common/StatCard'
import TaskItem       from '../../components/tasks/TaskItem'
import ProjectProgress from '../../components/projects/ProjectProgress'
import ActivityFeed   from '../../components/notifications/ActivityFeed'
import {
  IconAdd,
  IconProjects,
  IconTasks,
  IconTeam,
  IconProgress,
  IconCheck,
  IconWarning,
} from '../../components/common/WorkSyncIcons'

import { getTasks }         from '../../api/tasksApi'
import { getProjects }      from '../../api/projectsApi'
import { getNotifications } from '../../api/notificationsApi'

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */

/**
 * Normalise the backend enum value to the lowercase key the UI expects.
 * e.g. "IN_PROGRESS" → "inprogress", "IN_REVIEW" → "inreview"
 */
function normaliseStatus(s) {
  if (!s) return 'todo'
  return s.toLowerCase().replace(/_/g, '')
}

function normalisePriority(p) {
  if (!p) return 'medium'
  return p.toLowerCase()
}

/**
 * Format an ISO date string (or null) into a human-readable label.
 * Returns null when due_date is null so the UI hides the date column.
 */
function formatDueDate(isoDate) {
  if (!isoDate) return null
  const due   = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = (due - today) / 86_400_000   // days
  if (diff === 0)  return 'Today'
  if (diff === 1)  return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(isoDate) {
  if (!isoDate) return false
  const due = new Date(isoDate)
  return due < new Date()
}

function isDeadlineNear(isoDate, days = 14) {
  if (!isoDate) return false
  const due   = new Date(isoDate)
  const today = new Date()
  const diff  = (due - today) / 86_400_000
  return diff >= 0 && diff <= days
}

/**
 * Build a task shape the UI components expect from a raw TaskResponse
 * and the projects lookup map.
 */
function adaptTask(raw, projectMap) {
  return {
    id:       raw.id,
    title:    raw.title,
    project:  projectMap[raw.project_id]?.name ?? `Project #${raw.project_id}`,
    assignee: '—',                          // assignee name not in TaskResponse
    priority: normalisePriority(raw.priority),
    status:   normaliseStatus(raw.status),
    dueDate:  formatDueDate(raw.due_date),
    overdue:  isOverdue(raw.due_date),
    _raw:     raw,                          // keep original for any future use
  }
}

/**
 * Enrich each project with task-derived metrics:
 * tasksTotal, tasksDone, progress (%), deadlineNear, status (normalised).
 */
function adaptProject(raw, tasksByProject) {
  const projectTasks = tasksByProject[raw.id] ?? []
  const tasksTotal   = projectTasks.length
  const tasksDone    = projectTasks.filter(t => t.status === 'COMPLETED').length
  const progress     = tasksTotal === 0
    ? 0
    : Math.round((tasksDone / tasksTotal) * 100)

  return {
    id:           raw.id,
    name:         raw.name,
    status:       normaliseStatus(raw.status),
    progress,
    tasksTotal,
    tasksDone,
    deadline:     raw.due_date
      ? new Date(raw.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null,
    deadlineNear: isDeadlineNear(raw.due_date),
    _raw:         raw,
  }
}

/**
 * Convert a NotificationResponse into an ActivityFeed item.
 * The backend stores a flat `message` string; we expose it as the target
 * with a generic action verb, grouped by `type`.
 */
function adaptNotification(n) {
  const typeMap = {
    TASK_ASSIGNED: { action: 'assigned you to', type: 'assign' },
    TASK_UPDATED:  { action: 'updated',          type: 'status' },
    SUBMISSION:    { action: 'submitted work on', type: 'submit' },
    COMMENT:       { action: 'commented on',      type: 'comment' },
    REVIEW:        { action: 'reviewed',          type: 'review' },
    APPROVED:      { action: 'approved',          type: 'approve' },
  }
  const mapped  = typeMap[n.type] ?? { action: 'updated', type: 'status' }
  const created = new Date(n.created_at)
  const diffMin = Math.round((Date.now() - created) / 60_000)
  let time
  if (diffMin < 1)       time = 'just now'
  else if (diffMin < 60) time = `${diffMin} min ago`
  else if (diffMin < 1440) time = `${Math.round(diffMin / 60)} hr ago`
  else                   time = `${Math.round(diffMin / 1440)} days ago`

  // Derive initials from the message text as a best-effort fallback
  const initials = n.message.slice(0, 2).toUpperCase()

  return {
    id:       n.id,
    actor:    'WorkSync',           // actor name not in NotificationResponse
    initials,
    action:   mapped.action,
    target:   n.message,
    time,
    type:     mapped.type,
    unread:   !n.is_read,
  }
}

/* ─────────────────────────────────────────────────────────────────────
   STAT CARD CONFIG (static metadata; counts filled from API data)
───────────────────────────────────────────────────────────────────── */

const STAT_META = {
  manager: [
    { key: 'active_projects',     label: 'Active Projects',     icon: IconProjects, iconBgVar: '--color-primary-50',  iconColorVar: '--color-primary-600'  },
    { key: 'open_tasks',          label: 'Open Tasks',          icon: IconTasks,    iconBgVar: '--color-warning-50',  iconColorVar: '--color-warning-600'  },
    { key: 'in_review',           label: 'In Review',           icon: IconWarning,  iconBgVar: '--color-info-50',     iconColorVar: '--color-info-600'     },
    { key: 'completed_this_week', label: 'Completed This Week', icon: IconCheck,    iconBgVar: '--color-success-50',  iconColorVar: '--color-success-600'  },
  ],
  admin: [
    { key: 'active_projects',     label: 'Active Projects',     icon: IconProjects, iconBgVar: '--color-primary-50',  iconColorVar: '--color-primary-600'  },
    { key: 'open_tasks',          label: 'Open Tasks',          icon: IconTasks,    iconBgVar: '--color-warning-50',  iconColorVar: '--color-warning-600'  },
    { key: 'in_review',           label: 'In Review',           icon: IconWarning,  iconBgVar: '--color-info-50',     iconColorVar: '--color-info-600'     },
    { key: 'completed_this_week', label: 'Completed This Week', icon: IconCheck,    iconBgVar: '--color-success-50',  iconColorVar: '--color-success-600'  },
  ],
  member: [
    { key: 'open_tasks',          label: 'My Open Tasks',       icon: IconTasks,    iconBgVar: '--color-primary-50',  iconColorVar: '--color-primary-600'  },
    { key: 'in_review',           label: 'In Review',           icon: IconWarning,  iconBgVar: '--color-warning-50',  iconColorVar: '--color-warning-600'  },
    { key: 'completed_this_week', label: 'Completed This Week', icon: IconCheck,    iconBgVar: '--color-success-50',  iconColorVar: '--color-success-600'  },
    { key: 'active_projects',     label: "Projects I'm On",     icon: IconProjects, iconBgVar: '--color-info-50',     iconColorVar: '--color-info-600'     },
  ],
}

/**
 * Derive stat card values purely from the task and project arrays.
 * No separate stats endpoint exists.
 */
function deriveStats(role, tasks, projects) {
  const now          = new Date()
  const weekAgo      = new Date(now - 7 * 86_400_000)
  const openStatuses = new Set(['TODO', 'IN_PROGRESS'])

  const activeProjects     = projects.filter(p => p.status !== 'COMPLETED' && p.status !== 'ON_HOLD').length
  const openTasks          = tasks.filter(t => openStatuses.has(t.status)).length
  const inReview           = tasks.filter(t => t.status === 'IN_REVIEW').length
  const completedThisWeek  = tasks.filter(t =>
    t.status === 'COMPLETED' &&
    t.updated_at && new Date(t.updated_at) >= weekAgo
  ).length

  const countMap = {
    active_projects:     String(activeProjects),
    open_tasks:          String(openTasks),
    in_review:           String(inReview),
    completed_this_week: String(completedThisWeek),
  }

  return (STAT_META[role] ?? STAT_META.manager).map(meta => ({
    ...meta,
    value:  countMap[meta.key] ?? '—',
    change: null,
    trend:  null,
  }))
}

/* ─────────────────────────────────────────────────────────────────────
   ROLE CONFIG
───────────────────────────────────────────────────────────────────── */

const ROLE_CONFIG = {
  manager: {
    greeting:        name => `Good morning, ${name} — here's your team's progress today.`,
    action:          { label: 'New Task', key: 'new_task' },
    showReviewQueue: true,
    showProjects:    true,
    showActivity:    true,
    taskLabel:       'Upcoming Tasks',
    taskSubLabel:    'Tasks that need attention soon',
    showAssignee:    true,
  },
  admin: {
    greeting:        name => `Welcome back, ${name} — platform overview.`,
    action:          { label: 'Add User', key: 'add_user' },
    showReviewQueue: false,
    showProjects:    true,
    showActivity:    true,
    taskLabel:       'Upcoming Tasks',
    taskSubLabel:    'Across all teams',
    showAssignee:    true,
  },
  member: {
    greeting:        name => `Good morning, ${name} — here are your tasks for today.`,
    action:          { label: 'Submit Work', key: 'submit_work' },
    showReviewQueue: false,
    showProjects:    true,
    showActivity:    true,
    taskLabel:       'My Tasks',
    taskSubLabel:    'Tasks currently assigned to you',
    showAssignee:    false,
  },
}

/* ─────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS (identical UI to before — only data source changes)
───────────────────────────────────────────────────────────────────── */

const cardHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  gap: 'var(--space-3)', marginBottom: 'var(--space-4)',
}

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card dashboard-chart-card ${className}`} style={{ minWidth: 0 }}>
      <div className="card-header" style={cardHeaderStyle}>
        <div className="card-header-left">
          <h2 className="card-title">{title}</h2>
          <p className="caption">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function ProjectOverviewChart({ projects }) {
  const colors = ['#6949D0', '#A78BFA', '#C4B5FD', '#E1C9FF']
  return (
    <div className="dashboard-project-chart">
      <div className="dashboard-bar-chart" role="img" aria-label="Project completion percentages">
        {projects.map((project, index) => (
          <div className="dashboard-bar-row" key={project.id}>
            <span className="dashboard-bar-label" title={project.name}>{project.name}</span>
            <div className="dashboard-bar-track">
              <div
                className="dashboard-bar-fill"
                style={{ width: `${project.progress}%`, backgroundColor: colors[index % colors.length] }}
              />
            </div>
            <strong className="dashboard-bar-value">{project.progress}%</strong>
          </div>
        ))}
      </div>
      <p className="caption dashboard-chart-footnote">Overall progress across active projects</p>
    </div>
  )
}

function TaskStatusChart({ tasks }) {
  // Derive counts from real tasks; fall back to zeros when loading
  const counts = {
    'To Do':       tasks.filter(t => t._raw?.status === 'TODO').length,
    'In Progress': tasks.filter(t => t._raw?.status === 'IN_PROGRESS').length,
    'In Review':   tasks.filter(t => t._raw?.status === 'IN_REVIEW').length,
    'Completed':   tasks.filter(t => t._raw?.status === 'COMPLETED').length,
  }
  const statuses = [
    { label: 'To Do',       count: counts['To Do'],       color: '#C4B5FD' },
    { label: 'In Progress', count: counts['In Progress'], color: '#6949D0' },
    { label: 'In Review',   count: counts['In Review'],   color: '#F5B544' },
    { label: 'Completed',   count: counts['Completed'],   color: '#65B98A' },
  ]
  const total = statuses.reduce((sum, s) => sum + s.count, 0)
  let offset  = 0
  const segments = statuses.map(s => {
    const start = offset
    offset += total > 0 ? (s.count / total) * 100 : 25
    return { ...s, start, end: offset }
  })
  const gradient = total > 0
    ? `conic-gradient(${segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')})`
    : `conic-gradient(var(--color-neutral-200) 0% 100%)`

  return (
    <div className="dashboard-status-chart">
      <div className="dashboard-donut-wrap">
        <div className="dashboard-donut" style={{ background: gradient }}
          role="img" aria-label={`Task status distribution, ${total} tasks`}>
          <div className="dashboard-donut-hole">
            <strong>{total}</strong>
            <span>Tasks</span>
          </div>
        </div>
      </div>
      <div className="dashboard-status-legend">
        {statuses.map(s => (
          <div className="dashboard-legend-row" key={s.label}>
            <span className="dashboard-legend-dot" style={{ backgroundColor: s.color }} />
            <span>{s.label}</span>
            <strong>{s.count}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReviewQueue({ tasks }) {
  return (
    <section className="card dashboard-review-card">
      <div className="dashboard-review-heading">
        <div>
          <h2 className="card-title">Needs Your Review</h2>
          <p className="caption">{tasks.length} submission{tasks.length !== 1 ? 's' : ''} waiting</p>
        </div>
        <span className="badge badge-warning">Action required</span>
      </div>
      <div className="dashboard-review-list" role="list">
        {tasks.map(task => <TaskItem key={task.id} task={task} showAssignee />)}
      </div>
    </section>
  )
}

/* Skeleton row shown while data loads */
function SkeletonRows({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
      <div className="skeleton skeleton-text" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div className="skeleton skeleton-text w-3-4" />
        <div className="skeleton skeleton-text w-1-2" />
      </div>
    </div>
  ))
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────── */

export default function Dashboard({ role = 'manager', user = { name: 'there' } }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.manager

  /* ── state ─────────────────────────────────────────────────────── */
  const [rawTasks,         setRawTasks]         = useState([])
  const [rawProjects,      setRawProjects]       = useState([])
  const [rawNotifications, setRawNotifications]  = useState([])
  const [loadingTasks,     setLoadingTasks]      = useState(true)
  const [loadingProjects,  setLoadingProjects]   = useState(true)
  const [loadingNotifs,    setLoadingNotifs]      = useState(true)
  const [error,            setError]             = useState(null)

  /* ── fetch ─────────────────────────────────────────────────────── */
  useEffect(() => {
    getTasks()
      .then(setRawTasks)
      .catch(err => {
        // 401 means not logged in — silently leave tasks empty
        if (err?.response?.status !== 401) setError('Could not load tasks.')
      })
      .finally(() => setLoadingTasks(false))

    getProjects()
      .then(setRawProjects)
      .catch(err => {
        if (err?.response?.status !== 401) setError('Could not load projects.')
      })
      .finally(() => setLoadingProjects(false))

    getNotifications()
      .then(setRawNotifications)
      .catch(() => {}) // notifications failing silently is acceptable
      .finally(() => setLoadingNotifs(false))
  }, [])

  /* ── derive ────────────────────────────────────────────────────── */

  // Map project_id → ProjectResponse for task adaptation
  const projectMap = Object.fromEntries(rawProjects.map(p => [p.id, p]))

  // Map project_id → TaskResponse[] for project enrichment
  const tasksByProject = rawTasks.reduce((acc, t) => {
    ;(acc[t.project_id] ??= []).push(t)
    return acc
  }, {})

  const tasks    = rawTasks.map(t => adaptTask(t, projectMap))
  const projects = rawProjects.map(p => adaptProject(p, tasksByProject))
  const activity = rawNotifications.map(adaptNotification)
  const stats    = deriveStats(role, rawTasks, rawProjects)

  // Review queue: tasks with status IN_REVIEW
  const reviewTasks = tasks.filter(t => t._raw?.status === 'IN_REVIEW')

  // Prioritised task list for the upcoming card
  // Order: overdue first, then by due_date ascending, then by priority
  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 }
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    const aDate = a._raw?.due_date ? new Date(a._raw.due_date) : Infinity
    const bDate = b._raw?.due_date ? new Date(b._raw.due_date) : Infinity
    if (aDate !== bDate) return aDate - bDate
    return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
  })

  const loading = loadingTasks || loadingProjects

  /* ── render ────────────────────────────────────────────────────── */
  return (
    <div className="worksync-dashboard">

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Dashboard</h1>
          <p className="body-text">{config.greeting(user.name)}</p>
        </div>
        <button className="btn btn-primary" type="button">
          <IconAdd size={16} aria-hidden="true" />
          {config.action.label}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: 'var(--space-5)' }}>
          <p>{error} Showing whatever data is available.</p>
        </div>
      )}

      {/* Stat cards */}
      <section className="section" aria-label="Summary statistics">
        <div className="stats-grid">
          {stats.map(stat => <StatCard key={stat.key} {...stat} />)}
        </div>
      </section>

      {/* Charts: project overview + task status */}
      <section className="dashboard-chart-grid section" aria-label="Project and task charts">
        {config.showProjects && (
          <ChartCard title="Project Overview" subtitle="Progress across active projects">
            {loading
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton skeleton-text w-full" style={{ height: 18 }} />)}
                </div>
              : projects.length > 0
                ? <ProjectOverviewChart projects={projects} />
                : <p className="caption" style={{ padding: 'var(--space-4) 0' }}>No projects found.</p>
            }
          </ChartCard>
        )}
        <ChartCard title="Task Status" subtitle="Current task distribution">
          <TaskStatusChart tasks={loading ? [] : tasks} />
        </ChartCard>
      </section>

      {/* Review queue — manager only */}
      {config.showReviewQueue && reviewTasks.length > 0 && (
        <section className="section" aria-label="Tasks awaiting review">
          <ReviewQueue tasks={reviewTasks} />
        </section>
      )}

      {/* Upcoming tasks + activity */}
      <section className="dashboard-content-grid section" aria-label="Upcoming tasks and activity">

        {/* Task list */}
        <div className="card dashboard-upcoming-card">
          <div className="card-header" style={cardHeaderStyle}>
            <div className="card-header-left">
              <h2 className="card-title">{config.taskLabel}</h2>
              <p className="caption">{config.taskSubLabel}</p>
            </div>
            <button className="btn btn-secondary btn-sm" type="button">View all</button>
          </div>
          <div className="dashboard-task-list" role="list">
            {loadingTasks
              ? <SkeletonRows count={4} />
              : sortedTasks.length === 0
                ? <p className="caption" style={{ padding: 'var(--space-4) 0' }}>No tasks found.</p>
                : sortedTasks.slice(0, 5).map(task => (
                    <TaskItem key={task.id} task={task} showAssignee={config.showAssignee} />
                  ))
            }
          </div>
        </div>

        {/* Activity feed */}
        {config.showActivity && (
          <div className="card dashboard-activity-card">
            <div className="card-header" style={cardHeaderStyle}>
              <div className="card-header-left">
                <h2 className="card-title">Recent Activity</h2>
                <p className="caption">Latest updates from your team</p>
              </div>
            </div>
            {loadingNotifs
              ? <SkeletonRows count={4} />
              : <ActivityFeed items={activity} maxItems={5} />
            }
          </div>
        )}

      </section>
    </div>
  )
}
