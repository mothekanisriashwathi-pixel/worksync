export default function TaskStatusChart({ distribution = {} }) {
  const todo = distribution.todo || 0
  const inProgress = distribution.in_progress || 0
  const inReview = distribution.in_review || 0
  const completed = distribution.completed || 0

  const total = todo + inProgress + inReview + completed

  const segments = [
    { label: 'To Do', count: todo, color: '#94a3b8' },
    { label: 'In Progress', count: inProgress, color: '#26C6DA' },
    { label: 'In Review', count: inReview, color: '#f59e0b' },
    { label: 'Completed', count: completed, color: '#10b981' },
  ]

  let offset = 0
  const gradientParts = segments.map(s => {
    const pct = total > 0 ? (s.count / total) * 100 : 25
    const start = offset
    offset += pct
    return `${s.color} ${start}% ${offset}%`
  })

  const gradient = total > 0
    ? `conic-gradient(${gradientParts.join(', ')})`
    : `conic-gradient(#e2e8f0 0% 100%)`

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
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1A1A2E' }}>
          Task Status Distribution
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
          Breakdown of current task lifecycle
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '1.5rem',
          flex: 1,
          flexWrap: 'wrap',
          padding: '0.5rem 0',
        }}
      >
        {/* Doughnut Chart */}
        <div
          style={{
            position: 'relative',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
            flexShrink: 0,
          }}
          role="img"
          aria-label={`Task distribution doughnut chart with ${total} total tasks`}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1A1A2E', lineHeight: 1 }}>
              {total}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#777184', fontWeight: 600, marginTop: 2 }}>
              Tasks
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, minWidth: 140 }}>
          {segments.map(s => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
            return (
              <div
                key={s.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.825rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: '#4e4059', fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: '#9E8FAA', fontSize: '0.75rem' }}>{pct}%</span>
                  <strong style={{ color: '#1A1A2E', fontWeight: 700, minWidth: 20, textAlign: 'right' }}>
                    {s.count}
                  </strong>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
