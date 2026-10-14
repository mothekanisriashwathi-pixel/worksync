import { IconCalendar, IconTasks } from '../common/WorkSyncIcons'

const PRIORITY_BADGES = {
  URGENT: { bg: '#fee2e2', text: '#b91c1c' },
  HIGH: { bg: '#ffedd5', text: '#c2410c' },
  MEDIUM: { bg: '#fef3c7', text: '#b45309' },
  LOW: { bg: '#f1f5f9', text: '#475569' },
}

function formatTaskDate(isoDate) {
  if (!isoDate) return 'No due date'
  try {
    const d = new Date(isoDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(isoDate)
    target.setHours(0, 0, 0, 0)
    const diffDays = Math.round((target - now) / 86400000)

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`
    if (diffDays === 0) return 'Due Today'
    if (diffDays === 1) return 'Due Tomorrow'
    if (diffDays <= 7) return `Due in ${diffDays} days`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return isoDate
  }
}

export default function UpcomingDeadlines({ tasks = [], onOpenTask }) {
  if (tasks.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          padding: '2rem 1.5rem',
          border: '1px solid #E9E3EE',
          textAlign: 'center',
          color: '#777184',
        }}
      >
        <IconTasks size={36} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#1A1A2E', fontSize: '1rem' }}>No Upcoming Deadlines</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>All tasks are either completed or have no active deadlines.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: '1.4rem 1.5rem',
        border: '1px solid #E9E3EE',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1A1A2E' }}>
            Upcoming Deadlines & Priorities
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
            Time-sensitive deliverables requiring execution
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#dc2626',
          }}
        >
          {tasks.filter(t => t.is_overdue).length} Overdue
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {tasks.map(t => {
          const prioStyle = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.MEDIUM
          return (
            <div
              key={t.id}
              onClick={() => onOpenTask?.(t)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 10,
                border: '1px solid #f1f5f9',
                backgroundColor: t.is_overdue ? '#fff5f5' : '#fafafc',
                cursor: onOpenTask ? 'pointer' : 'default',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (onOpenTask) {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = 'rgba(38, 198, 218, 0.4)'
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (onOpenTask) {
                  e.currentTarget.style.backgroundColor = t.is_overdue ? '#fff5f5' : '#fafafc'
                  e.currentTarget.style.borderColor = '#f1f5f9'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      color: '#1A1A2E',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {t.title}
                  </h4>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: prioStyle.bg,
                      color: prioStyle.text,
                    }}
                  >
                    {t.priority}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#777184', marginTop: 3 }}>
                  {t.project_name} {t.assignee_name ? `• ${t.assignee_name}` : ''}
                </div>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: t.is_overdue ? '#dc2626' : '#64748b',
                  backgroundColor: t.is_overdue ? 'rgba(239, 68, 68, 0.1)' : '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                <IconCalendar size={13} />
                <span>{formatTaskDate(t.due_date)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
