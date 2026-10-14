import {
  IconAdd,
  IconCalendar,
  IconProjects,
  IconTasks,
  IconTeam,
  IconSettings,
} from '../common/WorkSyncIcons'

const VIEW_LABELS = {
  admin: 'Admin Overview',
  manager: 'Project Manager',
  team_lead: 'Team Lead',
  member: 'Member',
}

export default function DashboardHeader({
  greeting,
  subtitle,
  dateDisplay,
  role,
  activeView,
  allowedViews = [],
  onViewChange,
  onPrimaryAction,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#1A1A2E',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {greeting}
          </h1>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor:
                role === 'ADMIN'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : role === 'MANAGER'
                  ? 'rgba(38, 198, 218, 0.15)'
                  : 'rgba(100, 116, 139, 0.12)',
              color:
                role === 'ADMIN'
                  ? '#b91c1c'
                  : role === 'MANAGER'
                  ? '#0097a7'
                  : '#334155',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {role}
          </span>
        </div>

        <p style={{ margin: 0, color: '#777184', fontSize: '0.925rem', maxWidth: 650, lineHeight: 1.5 }}>
          {subtitle}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.65rem',
            fontSize: '0.8rem',
            color: '#9E8FAA',
            fontWeight: 500,
          }}
        >
          <IconCalendar size={14} />
          <span>{dateDisplay}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
        {/* Role Perspective Switcher (Only shown if authorized for multiple views) */}
        {allowedViews.length > 1 && (
          <div
            style={{
              display: 'inline-flex',
              padding: 4,
              backgroundColor: '#f1f5f9',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              gap: 4,
            }}
          >
            {allowedViews.map(v => {
              const isActive = activeView === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onViewChange?.(v)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 7,
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#1A1A2E' : '#64748b',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {VIEW_LABELS[v] || v}
                </button>
              )
            })}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onPrimaryAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1.35rem',
            borderRadius: 8,
            backgroundColor: '#26C6DA',
            color: '#1A1A2E',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(38, 198, 218, 0.35)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(38, 198, 218, 0.45)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(38, 198, 218, 0.35)'
          }}
        >
          <IconAdd size={18} />
          {activeView === 'member'
            ? 'Submit Work'
            : activeView === 'team_lead'
            ? 'Create Task'
            : activeView === 'manager'
            ? 'New Project'
            : 'New Initiative'}
        </button>
      </div>
    </div>
  )
}
