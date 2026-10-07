import StatCard from '../../components/common/StatCard'
import TaskItem from '../../components/tasks/TaskItem'
import ProjectProgress from '../../components/projects/ProjectProgress'
import ActivityFeed from '../../components/notifications/ActivityFeed'
import {
  IconAdd,
  IconProjects,
  IconTasks,
  IconTeam,
  IconProgress,
  IconCheck,
  IconWarning,
} from '../../components/common/WorkSyncIcons'

/**
 * Dashboard — main overview screen.
 *
 * Currently rendered for the Team Manager role.
 * Demo data is structured to map 1-to-1 with future API responses.
 * When backend integration is added (Phase 3+), replace DEMO_* constants
 * with API hook calls and pass the same shape into the components below.
 *
 * Role switching:  pass a `role` prop ('admin'|'manager'|'member') to
 * render the appropriate stat cards and sections.  The current default
 * is 'manager' for the demo shell.
 */

/* ─────────────────────────────────────────────────────────────────────
   DEMO DATA
   Structure matches expected API response shapes so replacement is easy.
───────────────────────────────────────────────────────────────────── */

const DEMO_STATS = {
  manager: [
    {
      key: 'active_projects',
      label: 'Active Projects',
      value: '8',
      change: '2 due this month',
      trend: null,
      icon: IconProjects,
      iconBgVar: '--color-primary-50',
      iconColorVar: '--color-primary-600',
    },
    {
      key: 'open_tasks',
      label: 'Open Tasks',
      value: '34',
      change: '6 need attention',
      trend: null,
      icon: IconTasks,
      iconBgVar: '--color-warning-50',
      iconColorVar: '--color-warning-600',
    },
    {
      key: 'in_review',
      label: 'In Review',
      value: '5',
      change: 'Awaiting your action',
      trend: null,
      icon: IconWarning,
      iconBgVar: '--color-info-50',
      iconColorVar: '--color-info-600',
    },
    {
      key: 'completed_this_week',
      label: 'Completed This Week',
      value: '18',
      change: '+4 vs last week',
      trend: 'up',
      icon: IconCheck,
      iconBgVar: '--color-success-50',
      iconColorVar: '--color-success-600',
    },
  ],
  admin: [
    {
      key: 'total_users',
      label: 'Total Users',
      value: '47',
      change: '+3 this month',
      trend: 'up',
      icon: IconTeam,
      iconBgVar: '--color-primary-50',
      iconColorVar: '--color-primary-600',
    },
    {
      key: 'total_teams',
      label: 'Teams',
      value: '6',
      change: '1 new this month',
      trend: 'up',
      icon: IconProgress,
      iconBgVar: '--color-info-50',
      iconColorVar: '--color-info-600',
    },
    {
      key: 'total_projects',
      label: 'Active Projects',
      value: '21',
      change: '5 due soon',
      trend: null,
      icon: IconProjects,
      iconBgVar: '--color-warning-50',
      iconColorVar: '--color-warning-600',
    },
    {
      key: 'tasks_completed',
      label: 'Tasks Completed',
      value: '312',
      change: '+47 this week',
      trend: 'up',
      icon: IconCheck,
      iconBgVar: '--color-success-50',
      iconColorVar: '--color-success-600',
    },
  ],
  member: [
    {
      key: 'my_open_tasks',
      label: 'My Open Tasks',
      value: '7',
      change: '2 due today',
      trend: null,
      icon: IconTasks,
      iconBgVar: '--color-primary-50',
      iconColorVar: '--color-primary-600',
    },
    {
      key: 'in_review',
      label: 'In Review',
      value: '2',
      change: 'Waiting on feedback',
      trend: null,
      icon: IconWarning,
      iconBgVar: '--color-warning-50',
      iconColorVar: '--color-warning-600',
    },
    {
      key: 'completed_this_week',
      label: 'Completed This Week',
      value: '5',
      change: 'Good progress!',
      trend: 'up',
      icon: IconCheck,
      iconBgVar: '--color-success-50',
      iconColorVar: '--color-success-600',
    },
    {
      key: 'active_projects',
      label: 'Projects I\'m On',
      value: '3',
      change: '1 near deadline',
      trend: null,
      icon: IconProjects,
      iconBgVar: '--color-info-50',
      iconColorVar: '--color-info-600',
    },
  ],
}

const DEMO_TASKS = [
  {
    id: 1,
    title: 'Fix authentication redirect bug',
    project: 'Backend Refactor',
    assignee: 'Sam Torres',
    priority: 'urgent',
    status: 'todo',
    dueDate: 'Today',
    overdue: true,
  },
  {
    id: 2,
    title: 'Update API documentation',
    project: 'Backend Refactor',
    assignee: 'Alex Kim',
    priority: 'high',
    status: 'inprogress',
    dueDate: 'Tomorrow',
    overdue: false,
  },
  {
    id: 3,
    title: 'Design new onboarding flow screens',
    project: 'Mobile App v2',
    assignee: 'Jordan Mills',
    priority: 'high',
    status: 'inreview',
    dueDate: 'Oct 10',
    overdue: false,
  },
  {
    id: 4,
    title: 'Write unit tests for payment module',
    project: 'Payments Integration',
    assignee: 'Riley Park',
    priority: 'medium',
    status: 'inprogress',
    dueDate: 'Oct 14',
    overdue: false,
  },
  {
    id: 5,
    title: 'Set up CI/CD pipeline for staging',
    project: 'DevOps Sprint',
    assignee: 'Casey Lee',
    priority: 'medium',
    status: 'todo',
    dueDate: 'Oct 16',
    overdue: false,
  },
  {
    id: 6,
    title: 'Review and merge PR #42',
    project: 'Backend Refactor',
    assignee: 'Sam Torres',
    priority: 'low',
    status: 'inreview',
    dueDate: 'Oct 11',
    overdue: false,
  },
]

/* Tasks that need the manager's attention (in review) */
const DEMO_REVIEW_TASKS = DEMO_TASKS.filter(t => t.status === 'inreview')

/* Tasks for the member view */
const DEMO_MY_TASKS = [
  {
    id: 10,
    title: 'Update API documentation',
    project: 'Backend Refactor',
    assignee: 'Me',
    priority: 'high',
    status: 'inprogress',
    dueDate: 'Tomorrow',
    overdue: false,
  },
  {
    id: 11,
    title: 'Write unit tests for payment module',
    project: 'Payments Integration',
    assignee: 'Me',
    priority: 'medium',
    status: 'todo',
    dueDate: 'Oct 14',
    overdue: false,
  },
  {
    id: 12,
    title: 'Design new onboarding flow screens',
    project: 'Mobile App v2',
    assignee: 'Me',
    priority: 'high',
    status: 'inreview',
    dueDate: 'Oct 10',
    overdue: false,
  },
]

const DEMO_PROJECTS = [
  {
    id: 1,
    name: 'Backend Refactor',
    status: 'inprogress',
    progress: 68,
    tasksTotal: 24,
    tasksDone: 16,
    deadline: 'Oct 20',
    deadlineNear: true,
  },
  {
    id: 2,
    name: 'Mobile App v2',
    status: 'inprogress',
    progress: 42,
    tasksTotal: 31,
    tasksDone: 13,
    deadline: 'Nov 5',
    deadlineNear: false,
  },
  {
    id: 3,
    name: 'Payments Integration',
    status: 'inprogress',
    progress: 18,
    tasksTotal: 18,
    tasksDone: 3,
    deadline: 'Nov 15',
    deadlineNear: false,
  },
  {
    id: 4,
    name: 'DevOps Sprint',
    status: 'inprogress',
    progress: 55,
    tasksTotal: 12,
    tasksDone: 7,
    deadline: 'Oct 25',
    deadlineNear: true,
  },
]

const DEMO_ACTIVITY = [
  {
    id: 1,
    actor: 'Sam Torres',
    initials: 'ST',
    action: 'submitted work on',
    target: 'Fix authentication redirect bug',
    time: '12 min ago',
    type: 'submit',
  },
  {
    id: 2,
    actor: 'Jordan Mills',
    initials: 'JM',
    action: 'commented on',
    target: 'Design new onboarding flow screens',
    time: '34 min ago',
    type: 'comment',
  },
  {
    id: 3,
    actor: 'Alex Kim',
    initials: 'AK',
    action: 'moved task to In Progress:',
    target: 'Update API documentation',
    time: '1 hr ago',
    type: 'status',
  },
  {
    id: 4,
    actor: 'Riley Park',
    initials: 'RP',
    action: 'completed',
    target: 'Write unit tests for auth module',
    time: '2 hrs ago',
    type: 'approve',
  },
  {
    id: 5,
    actor: 'Casey Lee',
    initials: 'CL',
    action: 'requested review on',
    target: 'Set up staging environment',
    time: '3 hrs ago',
    type: 'review',
  },
  {
    id: 6,
    actor: 'Jordan Mills',
    initials: 'JM',
    action: 'was assigned to',
    target: 'Design new onboarding flow screens',
    time: 'Yesterday',
    type: 'assign',
  },
]

/* ─────────────────────────────────────────────────────────────────────
   ROLE CONFIG
   Maps each role to its greeting, action button, and visible sections.
   Replace with context/auth hook in Phase 3+.
───────────────────────────────────────────────────────────────────── */

const ROLE_CONFIG = {
  manager: {
    greeting: (name) => `Good morning, ${name} — here's your team's progress today.`,
    action: { label: 'New Task', key: 'new_task' },
    showReviewQueue: true,
    showTeamTasks: true,
    showProjects: true,
    showActivity: true,
    taskLabel: 'Team Tasks',
    taskSubLabel: 'All open and in-progress tasks',
  },
  admin: {
    greeting: (name) => `Welcome back, ${name} — platform overview.`,
    action: { label: '+ Add User', key: 'add_user' },
    showReviewQueue: false,
    showTeamTasks: true,
    showProjects: true,
    showActivity: true,
    taskLabel: 'Recent Tasks',
    taskSubLabel: 'Across all teams',
  },
  member: {
    greeting: (name) => `Good morning, ${name} — here are your tasks for today.`,
    action: { label: 'Submit Work', key: 'submit_work' },
    showReviewQueue: false,
    showTeamTasks: false,
    showProjects: true,
    showActivity: true,
    taskLabel: 'My Tasks',
    taskSubLabel: 'Tasks currently assigned to you',
  },
}

/* ─────────────────────────────────────────────────────────────────────
   DASHBOARD COMPONENT
───────────────────────────────────────────────────────────────────── */

/**
 * Props:
 *   role {string} 'admin'|'manager'|'member'  — default 'manager'
 *   user {object} { name: string }             — default demo user
 *
 * Both props will be supplied by AuthContext in Phase 3.
 */
export default function Dashboard({ role = 'manager', user = { name: 'Sri Ashwathi' } }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.manager
  const stats  = DEMO_STATS[role] ?? DEMO_STATS.manager
  const tasks  = role === 'member' ? DEMO_MY_TASKS : DEMO_TASKS

  return (
    <div>

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-info">
          <h1 className="page-title">Dashboard</h1>
          <p className="body-text">{config.greeting(user.name)}</p>
        </div>
        <button className="btn btn-primary">
          <IconAdd size={16} aria-hidden="true" />
          {config.action.label}
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <section className="section" aria-label="Summary statistics">
        <div className="stats-grid">
          {stats.map(stat => (
            <StatCard key={stat.key} {...stat} />
          ))}
        </div>
      </section>

      {/* ── Review queue (manager only) ──────────────────────── */}
      {config.showReviewQueue && DEMO_REVIEW_TASKS.length > 0 && (
        <section className="section" aria-label="Tasks awaiting review">
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="card-title">Needs Your Review</h2>
                <p className="caption">
                  {DEMO_REVIEW_TASKS.length} submission{DEMO_REVIEW_TASKS.length !== 1 ? 's' : ''} waiting
                </p>
              </div>
              <span className="badge badge-warning" style={{ fontSize: 'var(--fs-sm)' }}>
                Action required
              </span>
            </div>
            <div
              role="list"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            >
              {DEMO_REVIEW_TASKS.map(task => (
                <TaskItem key={task.id} task={task} showAssignee />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Main grid: tasks + projects + activity ───────────── */}
      <section className="section dashboard-main-grid" aria-label="Tasks and projects">

        {/* Left column: task list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', minWidth: 0 }}>

          {/* Task list */}
          <div className="card" style={{ minWidth: 0 }}>
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="card-title">{config.taskLabel}</h2>
                <p className="caption">{config.taskSubLabel}</p>
              </div>
              <button className="btn btn-secondary btn-sm">View all</button>
            </div>
            <div
              role="list"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
            >
              {tasks.slice(0, 5).map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  showAssignee={role !== 'member'}
                />
              ))}
            </div>
          </div>

          {/* Activity feed (stacks below tasks on smaller screens) */}
          <div className="card dashboard-activity-mobile">
            <div className="card-header">
              <div className="card-header-left">
                <h2 className="card-title">Recent Activity</h2>
                <p className="caption">Latest updates from your team</p>
              </div>
            </div>
            <ActivityFeed items={DEMO_ACTIVITY} maxItems={5} />
          </div>

        </div>

        {/* Right column: projects + activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

          {/* Projects */}
          {config.showProjects && (
            <div className="card">
              <div className="card-header">
                <div className="card-header-left">
                  <h2 className="card-title">Projects</h2>
                  <p className="caption">{DEMO_PROJECTS.length} active</p>
                </div>
                <button className="btn btn-secondary btn-sm">View all</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {DEMO_PROJECTS.map(project => (
                  <ProjectProgress key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

        </div>

      </section>

    </div>
  )
}
