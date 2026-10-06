/**
 * ActivityFeed — compact list of recent activity items.
 *
 * Each activity item:
 *   id       {number|string}
 *   actor    {string}   name of who performed the action
 *   initials {string}   2-char initials for avatar
 *   action   {string}   verb phrase, e.g. "commented on"
 *   target   {string}   what was acted on
 *   time     {string}   human-readable, e.g. "5 min ago"
 *   type     {'comment'|'status'|'submit'|'assign'|'approve'|'review'}
 *
 * Props:
 *   items    {array}   list of activity items
 *   maxItems {number}  optional cap (default: show all)
 */

const TYPE_COLORS = {
  comment: { bg: '--color-primary-50',  text: '--color-primary-600'  },
  status:  { bg: '--color-info-50',     text: '--color-info-600'     },
  submit:  { bg: '--color-success-50',  text: '--color-success-600'  },
  assign:  { bg: '--color-warning-50',  text: '--color-warning-600'  },
  approve: { bg: '--color-success-50',  text: '--color-success-600'  },
  review:  { bg: '--color-primary-50',  text: '--color-primary-600'  },
}

export default function ActivityFeed({ items, maxItems }) {
  const displayed = maxItems ? items.slice(0, maxItems) : items

  if (!displayed.length) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <p className="caption">No recent activity</p>
      </div>
    )
  }

  return (
    <ul
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}
      aria-label="Recent activity"
    >
      {displayed.map((item, idx) => (
        <ActivityItem key={item.id} item={item} last={idx === displayed.length - 1} />
      ))}
    </ul>
  )
}

function ActivityItem({ item, last }) {
  const colors = TYPE_COLORS[item.type] ?? TYPE_COLORS.comment

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) 0',
        borderBottom: last ? 'none' : '1px solid var(--border-color)',
      }}
    >
      {/* Initials avatar */}
      <div
        className="avatar avatar-sm"
        style={{
          backgroundColor: `var(${colors.bg})`,
          color: `var(${colors.text})`,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {item.initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-relaxed)',
          }}
        >
          <span style={{ fontWeight: 'var(--font-semibold)' }}>{item.actor}</span>
          {' '}{item.action}{' '}
          <span
            style={{
              fontWeight: 'var(--font-medium)',
              color: 'var(--color-primary-600)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.target}
          </span>
        </p>
        <p className="caption" style={{ marginTop: 'var(--space-1)' }}>
          {item.time}
        </p>
      </div>
    </li>
  )
}
