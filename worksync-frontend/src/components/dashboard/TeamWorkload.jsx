import { IconTeam } from '../common/WorkSyncIcons'

export default function TeamWorkload({ workload = [] }) {
  if (workload.length === 0) {
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
        <IconTeam size={36} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#1A1A2E', fontSize: '1rem' }}>No Team Workload Data</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>Members assigned tasks will be visible here.</p>
      </div>
    )
  }

  // Find max total tasks across members to scale horizontal bar
  const maxTasks = Math.max(...workload.map(w => w.total_tasks), 1)

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
            Team Workload & Capacity
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
            Task allocation and execution across team members
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            color: '#4f46e5',
          }}
        >
          {workload.length} Members
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {workload.map(member => {
          const loadPct = Math.round((member.total_tasks / maxTasks) * 100)
          return (
            <div
              key={member.user_id}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 10,
                border: '1px solid #f1f5f9',
                backgroundColor: '#fafafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#26C6DA',
                      color: '#1A1A2E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                    }}
                  >
                    {member.name ? member.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A1A2E' }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#777184' }}>
                      {member.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                  <span title="Open Tasks" style={{ color: '#64748b' }}>
                    Open: <strong style={{ color: '#1A1A2E' }}>{member.open_tasks}</strong>
                  </span>
                  <span title="In Review" style={{ color: '#d97706' }}>
                    Review: <strong>{member.in_review}</strong>
                  </span>
                  <span title="Completed" style={{ color: '#059669' }}>
                    Done: <strong>{member.completed}</strong>
                  </span>
                </div>
              </div>

              {/* Workload Bar */}
              <div style={{ height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${loadPct}%`,
                    height: '100%',
                    backgroundColor: loadPct > 80 ? '#ef4444' : loadPct > 50 ? '#26C6DA' : '#6366f1',
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
