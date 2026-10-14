import { IconProjects, IconTasks, IconTeam, IconSettings } from '../common/WorkSyncIcons'

export default function PlatformOverview({ overview, onNavigate }) {
  if (!overview) return null

  const userDist = overview.user_distribution || {}
  const taskHealth = overview.task_health || {}

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
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1A1A2E' }}>
          Platform Architecture & User Distribution
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
          Real-time account tiers and system wide resource health
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* User Roles */}
        <div style={{ padding: '1rem', borderRadius: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A1A2E', marginBottom: '0.65rem' }}>
            Users By Role
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>Administrators:</span>
              <strong>{userDist.ADMIN || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0097a7', fontWeight: 600 }}>Managers / Leads:</span>
              <strong>{userDist.MANAGER || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Team Members:</span>
              <strong>{userDist.MEMBER || 0}</strong>
            </div>
          </div>
        </div>

        {/* System Task Health */}
        <div style={{ padding: '1rem', borderRadius: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1A1A2E', marginBottom: '0.65rem' }}>
            Global Task Health
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#059669', fontWeight: 600 }}>Completed:</span>
              <strong>{taskHealth.completed || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#0097a7', fontWeight: 600 }}>In Progress:</span>
              <strong>{taskHealth.in_progress || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>Overdue / At Risk:</span>
              <strong>{taskHealth.overdue || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Shortcuts */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onNavigate?.('/team')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#1A1A2E',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <IconTeam size={14} />
          Manage Users & Teams
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('/projects')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#1A1A2E',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <IconProjects size={14} />
          View All Projects
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('/settings')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            color: '#1A1A2E',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <IconSettings size={14} />
          System Settings
        </button>
      </div>
    </div>
  )
}
