import { IconCalendar, IconTasks } from '../common/WorkSyncIcons'

/**
 * ProjectProgress — compact project card showing name, progress bar,
 * task counts, deadline, and status badge.
 *
 * Props:
 *   project {object}:
 *     id           {number|string}
 *     name         {string}
 *     status       {'todo'|'inprogress'|'completed'}
 *     progress     {number}   0–100 percent
 *     tasksTotal   {number}
 *     tasksDone    {number}
 *     deadline     {string}   human-readable, e.g. "Oct 20"
 *     deadlineNear {boolean}  optional — highlights deadline in warning color
 *   onAction       {function} optional click handler
 */

const STATUS_MAP = {
  todo:       { cls: 'badge-todo',       label: 'Not Started' },
  inprogress: { cls: 'badge-inprogress', label: 'In Progress' },
  completed:  { cls: 'badge-completed',  label: 'Completed'   },
}

function progressFillClass(pct) {
  if (pct >= 75) return 'success'
  if (pct < 25)  return 'warning'
  return ''
}

export default function ProjectProgress({ project, onAction }) {
  const status  = STATUS_MAP[project.status] ?? STATUS_MAP.inprogress
  const fill    = progressFillClass(project.progress)

  return (
    <div
      onClick={onAction}
      onKeyDown={e => e.key === 'Enter' && onAction?.()}
      tabIndex={onAction ? 0 : undefined}
      role={onAction ? 'button' : undefined}
      aria-label={onAction ? `Open project: ${project.name}` : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        cursor: onAction ? 'pointer' : 'default',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        backgroundColor: 'var(--surface-card)',
        transition: 'border-color var(--transition-base), box-shadow var(--transition-base)',
      }}
      onMouseEnter={e => {
        if (onAction) {
          e.currentTarget.style.borderColor = 'var(--color-primary-300)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-color)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <p
          style={{
            fontSize: 'var(--fs-base)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {project.name}
        </p>
        <span className={`badge ${status.cls}`} style={{ flexShrink: 0 }}>
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <span className="caption">Progress</span>
          <span
            className="caption"
            style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}
          >
            {project.progress}%
          </span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={project.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${project.name} progress: ${project.progress}%`}
        >
          <div
            className={`progress-fill${fill ? ` ${fill}` : ''}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Footer: task count + deadline */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span
          className="caption"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
        >
          <IconTasks size={12} aria-hidden="true" />
          {project.tasksDone}/{project.tasksTotal} tasks
        </span>
        {project.deadline && (
          <span
            className="caption"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              color: project.deadlineNear
                ? 'var(--color-warning-600)'
                : 'var(--text-tertiary)',
              fontWeight: project.deadlineNear ? 'var(--font-medium)' : undefined,
            }}
          >
            <IconCalendar size={12} aria-hidden="true" />
            {project.deadline}
          </span>
        )}
      </div>
    </div>
  )
}
