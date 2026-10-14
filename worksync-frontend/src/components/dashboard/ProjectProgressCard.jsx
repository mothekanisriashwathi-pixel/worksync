import { IconGitHub, IconProjects } from '../common/WorkSyncIcons'

const HEALTH_COLORS = {
  'On Track': { bg: '#dcfce7', text: '#15803d' },
  'At Risk': { bg: '#fef3c7', text: '#b45309' },
  'Delayed': { bg: '#fee2e2', text: '#b91c1c' },
  'Completed': { bg: '#e0f2fe', text: '#0369a1' },
}

export default function ProjectProgressCard({ projects = [], onOpenProject }) {
  if (projects.length === 0) {
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
        <IconProjects size={36} style={{ color: '#cbd5e1', marginBottom: '0.75rem' }} />
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#1A1A2E', fontSize: '1rem' }}>No Active Projects</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>Projects assigned to you will appear here.</p>
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
            Project Portfolio & Progress
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
            Active initiatives and real-time delivery health
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: 'rgba(38, 198, 218, 0.12)',
            color: '#0097a7',
          }}
        >
          {projects.length} Total
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {projects.map(p => {
          const healthStyle = HEALTH_COLORS[p.health] || HEALTH_COLORS['On Track']
          return (
            <div
              key={p.id}
              onClick={() => onOpenProject?.(p)}
              style={{
                padding: '1rem',
                borderRadius: 10,
                border: '1px solid #f1f5f9',
                backgroundColor: '#fafafc',
                cursor: onOpenProject ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (onOpenProject) {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.borderColor = 'rgba(38, 198, 218, 0.4)'
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (onOpenProject) {
                  e.currentTarget.style.backgroundColor = '#fafafc'
                  e.currentTarget.style.borderColor = '#f1f5f9'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1A1A2E' }}>
                      {p.name}
                    </h4>
                    {p.github_repo_url && (
                      <span title="Linked to GitHub" style={{ color: '#24292e', display: 'flex' }}>
                        <IconGitHub size={14} />
                      </span>
                    )}
                  </div>
                  {p.team_name && (
                    <div style={{ fontSize: '0.75rem', color: '#777184', marginTop: 2 }}>
                      {p.team_name}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: healthStyle.bg,
                    color: healthStyle.text,
                  }}
                >
                  {p.health}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#777184', marginBottom: 4 }}>
                  <span>Tasks: {p.tasks_done}/{p.tasks_total}</span>
                  <strong style={{ color: '#0097a7' }}>{p.progress}%</strong>
                </div>
                <div style={{ height: 6, borderRadius: 3, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${p.progress}%`,
                      height: '100%',
                      backgroundColor: p.health === 'Delayed' ? '#ef4444' : p.health === 'At Risk' ? '#f59e0b' : '#26C6DA',
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {p.due_date && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#9E8FAA' }}>
                  Due: {p.due_date}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
