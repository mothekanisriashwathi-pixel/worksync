import {
  IconTasks,
  IconProjects,
  IconTeam,
  IconProgress,
  IconCalendar,
  IconAdd,
  IconMoreOptions,
  IconCheck,
} from '../../components/common/WorkSyncIcons'

/**
 * Dashboard — representative demo screen.
 * Uses only design system classes. No backend calls.
 * Purpose: validate layout, typography, cards, badges, progress bars,
 * and responsive behavior across desktop / tablet / mobile.
 */

/* ── Demo data ─────────────────────────────────────────────── */

const STATS = [
  {
    label: 'Active Projects',
    value: '12',
    change: '+2 this month',
    positive: true,
    icon: IconProjects,
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
  },
  {
    label: 'Open Tasks',
    value: '47',
    change: '8 due today',
    positive: null,
    icon: IconTasks,
    iconBg: '#eff6ff',
    iconColor: '#1d4ed8',
  },
  {
    label: 'Team Members',
    value: '9',
    change: '+1 this week',
    positive: true,
    icon: IconTeam,
    iconBg: '#f0fdf4',
    iconColor: '#15803d',
  },
  {
    label: 'Completed Tasks',
    value: '134',
    change: '+23 this week',
    positive: true,
    icon: IconProgress,
    iconBg: '#faf5ff',
    iconColor: '#7e22ce',
  },
]

const RECENT_TASKS = [
  {
    id: 1,
    title: 'Update API documentation',
    project: 'Backend Refactor',
    assignee: 'Alex K.',
    priority: 'high',
    status: 'inprogress',
    due: 'Today',
    overdue: false,
  },
  {
    id: 2,
    title: 'Design new onboarding flow',
    project: 'Mobile App v2',
    assignee: 'Jordan M.',
    priority: 'urgent',
    status: 'inreview',
    due: 'Tomorrow',
    overdue: false,
  },
  {
    id: 3,
    title: 'Fix authentication redirect bug',
    project: 'Backend Refactor',
    assignee: 'Sam T.',
    priority: 'urgent',
    status: 'todo',
    due: 'Oct 3',
    overdue: true,
  },
  {
    id: 4,
    title: 'Write unit tests for payment module',
    project: 'Payments Integration',
    assignee: 'Riley P.',
    priority: 'medium',
    status: 'inprogress',
    due: 'Oct 10',
    overdue: false,
  },
  {
    id: 5,
    title: 'Set up staging environment',
    project: 'DevOps Sprint',
    assignee: 'Casey L.',
    priority: 'low',
    status: 'completed',
    due: 'Oct 5',
    overdue: false,
  },
]

const PROJECTS = [
  {
    id: 1,
    name: 'Backend Refactor',
    description: 'Migrate legacy endpoints to FastAPI with full test coverage.',
    progress: 68,
    tasksTotal: 24,
    tasksDone: 16,
    status: 'inprogress',
    deadline: 'Oct 20',
  },
  {
    id: 2,
    name: 'Mobile App v2',
    description: 'Redesign the mobile experience with updated design system.',
    progress: 42,
    tasksTotal: 31,
    tasksDone: 13,
    status: 'inprogress',
    deadline: 'Nov 5',
  },
  {
    id: 3,
    name: 'Payments Integration',
    description: 'Integrate Stripe and add subscription management.',
    progress: 15,
    tasksTotal: 18,
    tasksDone: 3,
    status: 'inprogress',
    deadline: 'Nov 15',
  },
]

const TEAM_MEMBERS = [
  { id: 1, name: 'Alex Kim',     role: 'Frontend Dev',   initials: 'AK', tasks: 8,  color: '#4f46e5' },
  { id: 2, name: 'Jordan Mills', role: 'UX Designer',    initials: 'JM', tasks: 5,  color: '#0284c7' },
  { id: 3, name: 'Sam Torres',   role: 'Backend Dev',    initials: 'ST', tasks: 11, color: '#15803d' },
  { id: 4, name: 'Riley Park',   role: 'QA Engineer',    initials: 'RP', tasks: 4,  color: '#7e22ce' },
  { id: 5, name: 'Casey Lee',    role: 'DevOps',         initials: 'CL', tasks: 6,  color: '#b45309' },
]

/* ── Status helpers ────────────────────────────────────────── */

const STATUS_BADGE = {
  todo:       { cls: 'badge-todo',       label: 'To Do'       },
  inprogress: { cls: 'badge-inprogress', label: 'In Progress' },
  inreview:   { cls: 'badge-inreview',   label: 'In Review'   },
  completed:  { cls: 'badge-completed',  label: 'Completed'   },
}

const PRIORITY_BADGE = {
  low:    { cls: 'badge-low',    label: 'Low'    },
  medium: { cls: 'badge-medium', label: 'Medium' },
  high:   { cls: 'badge-high',   label: 'High'   },
  urgent: { cls: 'badge-urgent', label: 'Urgent' },
}

function progressColor(pct) {
  if (pct >= 75) return 'success'
  if (pct >= 40) return ''
  return 'warning'
}

/* ── Component ─────────────────────────────────────────────── */

export default function Dashboard() {
  return (
    <div>

      {/* Page header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Dashboard</h1>
          <p className="body-text">
            Good morning, Sri Ashwathi — here's what's happening today.
          </p>
        </div>
        <button className="btn btn-primary">
          <IconAdd size={16} />
          New Task
        </button>
      </div>

      {/* ── Stat cards ── */}
      <section className="section" aria-label="Summary statistics">
        <div className="stats-grid">
          {STATS.map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ── Recent tasks + active projects ── */}
      <section className="section dashboard-main-grid">
        {/* Recent tasks */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-header">
            <div className="card-header-left">
              <h2 className="card-title">Recent Tasks</h2>
              <p className="caption">Your team's latest activity</p>
            </div>
            <button className="btn btn-secondary btn-sm">View all</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {RECENT_TASKS.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </div>

        {/* Active projects */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <h2 className="card-title">Active Projects</h2>
              <p className="caption">{PROJECTS.length} in progress</p>
            </div>
            <button className="btn-icon" aria-label="More options">
              <IconMoreOptions size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {PROJECTS.map(project => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Team snapshot ── */}
      <section className="section" aria-label="Team overview">
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <h2 className="card-title">Team</h2>
              <p className="caption">Workload overview</p>
            </div>
            <button className="btn btn-secondary btn-sm">
              <IconTeam size={14} />
              Manage team
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {TEAM_MEMBERS.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────── */

function StatCard({ label, value, change, positive, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="stat-card">
      <div
        className="stat-card-icon"
        style={{ backgroundColor: iconBg }}
        aria-hidden="true"
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
      {change && (
        <div
          className={`stat-card-change${positive === true ? ' positive' : positive === false ? ' negative' : ''}`}
        >
          {change}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task }) {
  const status   = STATUS_BADGE[task.status]   ?? STATUS_BADGE.todo
  const priority = PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.medium

  return (
    <div
      className="task-card"
      role="listitem"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Status indicator dot */}
      <span
        className={`status-dot status-dot-${task.status}`}
        style={{ marginTop: 4, flexShrink: 0 }}
        aria-hidden="true"
      />

      <div className="task-card-body">
        <p className="task-card-title">{task.title}</p>
        <div className="task-card-meta">
          <span className="caption">{task.project}</span>
          <span className="caption" style={{ color: 'var(--color-neutral-300)' }}>·</span>
          <span className="caption">{task.assignee}</span>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span className={`badge ${priority.cls}`}>{priority.label}</span>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        <span
          className="caption"
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            color: task.overdue ? 'var(--color-danger-600)' : 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          <IconCalendar size={12} />
          {task.due}
        </span>
      </div>
    </div>
  )
}

function ProjectRow({ project }) {
  const pct = project.progress
  const fillClass = progressColor(pct)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <div style={{ minWidth: 0 }}>
          <p
            className="font-semibold"
            style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {project.name}
          </p>
          <p className="caption" style={{ marginTop: 2 }}>{project.deadline} deadline</p>
        </div>
        <span className="caption font-semibold" style={{ flexShrink: 0 }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${project.name} progress`}>
        <div
          className={`progress-fill${fillClass ? ` ${fillClass}` : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="caption" style={{ marginTop: 'var(--space-2)' }}>
        {project.tasksDone} / {project.tasksTotal} tasks complete
      </p>
    </div>
  )
}

function MemberCard({ member }) {
  return (
    <div className="member-card">
      <div
        className="avatar avatar-md"
        style={{ backgroundColor: member.color + '22', color: member.color }}
        aria-hidden="true"
      >
        {member.initials}
      </div>
      <div className="member-card-info">
        <p className="member-card-name truncate">{member.name}</p>
        <p className="member-card-role">{member.role}</p>
        <p className="caption" style={{ marginTop: 'var(--space-1)' }}>
          {member.tasks} open tasks
        </p>
      </div>
    </div>
  )
}
