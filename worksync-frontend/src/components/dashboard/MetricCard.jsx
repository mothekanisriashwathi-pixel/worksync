import {
  IconTasks,
  IconProjects,
  IconTeam,
  IconCheck,
  IconWarning,
  IconProgress,
} from '../common/WorkSyncIcons'

const ICONS = {
  tasks: IconTasks,
  projects: IconProjects,
  team: IconTeam,
  check: IconCheck,
  warning: IconWarning,
  progress: IconProgress,
}

const COLOR_STYLES = {
  primary: {
    bg: 'rgba(38, 198, 218, 0.12)',
    icon: '#0097a7',
    border: 'rgba(38, 198, 218, 0.25)',
  },
  info: {
    bg: 'rgba(99, 102, 241, 0.12)',
    icon: '#4f46e5',
    border: 'rgba(99, 102, 241, 0.25)',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)',
    icon: '#d97706',
    border: 'rgba(245, 158, 11, 0.25)',
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.12)',
    icon: '#dc2626',
    border: 'rgba(239, 68, 68, 0.25)',
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.12)',
    icon: '#059669',
    border: 'rgba(16, 185, 129, 0.25)',
  },
}

export default function MetricCard({ item }) {
  const IconComp = ICONS[item.icon] || IconTasks
  const theme = COLOR_STYLES[item.color] || COLOR_STYLES.primary

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: '1.4rem 1.5rem',
        border: '1px solid #E9E3EE',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)'
        e.currentTarget.style.borderColor = 'rgba(38, 198, 218, 0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.03)'
        e.currentTarget.style.borderColor = '#E9E3EE'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#777184' }}>
          {item.label}
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: theme.bg,
            color: theme.icon,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconComp size={20} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#1A1A2E', lineHeight: 1 }}>
          {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
        </span>
        {item.trend && (
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
            {item.trend}
          </span>
        )}
      </div>
    </div>
  )
}
