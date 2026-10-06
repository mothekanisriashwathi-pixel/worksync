import { IconCalendar, IconMoreOptions } from '../common/WorkSyncIcons'

/**
 * TaskItem — single task row used in dashboard task lists.
 *
 * Props:
 *   task {object}:
 *     id         {number|string}
 *     title      {string}
 *     project    {string}
 *     assignee   {string}          optional — shown when relevant
 *     priority   {'low'|'medium'|'high'|'urgent'}
 *     status     {'todo'|'inprogress'|'inreview'|'completed'}
 *     dueDate    {string}          human-readable, e.g. "Today", "Oct 12"
 *     overdue    {boolean}
 *   showAssignee {boolean}         default false
 *   onAction     {function}        optional click handler
 */

const STATUS_MAP = {
  todo:       { cls: 'badge-todo',       label: 'To Do'       },
  inprogress: { cls: 'badge-inprogress', label: 'In Progress' },
  inreview:   { cls: 'badge-inreview',   label: 'In Review'   },
  completed:  { cls: 'badge-completed',  label: 'Completed'   },
}

const PRIORITY_MAP = {
  low:    { cls: 'badge-low',    label: 'Low'    },
  medium: { cls: 'badge-medium', label: 'Medium' },
  high:   { cls: 'badge-high',   label: 'High'   },
  urgent: { cls: 'badge-urgent', label: 'Urgent' },
}

const STATUS_DOT = {
  todo:      'status-dot-todo',
  inprogress:'status-dot-inprogress',
  inreview:  'status-dot-inreview',
  completed: 'status-dot-completed',
}

export default function TaskItem({ task, showAssignee = false, onAction }) {
  const status   = STATUS_MAP[task.status]   ?? STATUS_MAP.todo
  const priority = PRIORITY_MAP[task.priority] ?? PRIORITY_MAP.medium

  return (
    <div
      className="task-card"
      role="listitem"
      tabIndex={0}
      aria-label={`Task: ${task.title}, ${priority.label} priority, ${status.label}`}
      onClick={onAction}
      onKeyDown={e => e.key === 'Enter' && onAction?.()}
      style={{ cursor: onAction ? 'pointer' : 'default' }}
    >
      {/* Status dot */}
      <span
        className={`status-dot ${STATUS_DOT[task.status] ?? 'status-dot-todo'}`}
        style={{ marginTop: 5, flexShrink: 0 }}
        aria-hidden="true"
      />

      {/* Body */}
      <div className="task-card-body">
        <p className="task-card-title">{task.title}</p>
        <div className="task-card-meta">
          <span className="caption">{task.project}</span>
          {showAssignee && task.assignee && (
            <>
              <span className="caption" style={{ color: 'var(--color-neutral-300)' }}>·</span>
              <span className="caption">{task.assignee}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: priority · status · due date */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        flexShrink: 0,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}>
        <span className={`badge ${priority.cls}`}>{priority.label}</span>
        <span className={`badge ${status.cls}`}>{status.label}</span>
        {task.dueDate && (
          <span
            className="caption"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)',
              color: task.overdue
                ? 'var(--color-danger-600)'
                : 'var(--text-tertiary)',
              whiteSpace: 'nowrap',
            }}
          >
            <IconCalendar size={12} aria-hidden="true" />
            {task.dueDate}
          </span>
        )}
      </div>
    </div>
  )
}
