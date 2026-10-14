import {
  IconAdd,
  IconProjects,
  IconTasks,
  IconTeam,
  IconCheck,
  IconSettings,
} from '../common/WorkSyncIcons'

export default function QuickActions({ activeView, onAction, onNavigate }) {
  const actions = {
    member: [
      { label: 'Submit Work', icon: IconCheck, action: () => onAction?.('submit_work'), primary: true },
      { label: 'View My Tasks', icon: IconTasks, action: () => onNavigate?.('/tasks') },
      { label: 'My Projects', icon: IconProjects, action: () => onNavigate?.('/projects') },
    ],
    team_lead: [
      { label: 'Create Task', icon: IconAdd, action: () => onAction?.('create_task'), primary: true },
      { label: 'Review Submissions', icon: IconCheck, action: () => onAction?.('review_queue') },
      { label: 'View Team Members', icon: IconTeam, action: () => onNavigate?.('/team') },
      { label: 'All Projects', icon: IconProjects, action: () => onNavigate?.('/projects') },
    ],
    manager: [
      { label: 'New Project', icon: IconAdd, action: () => onAction?.('create_project'), primary: true },
      { label: 'Create Task', icon: IconTasks, action: () => onAction?.('create_task') },
      { label: 'Manage Team', icon: IconTeam, action: () => onNavigate?.('/team') },
      { label: 'Project Portfolio', icon: IconProjects, action: () => onNavigate?.('/projects') },
    ],
    admin: [
      { label: 'New Project', icon: IconAdd, action: () => onAction?.('create_project'), primary: true },
      { label: 'Manage Users', icon: IconTeam, action: () => onNavigate?.('/team') },
      { label: 'All Tasks', icon: IconTasks, action: () => onNavigate?.('/tasks') },
      { label: 'System Settings', icon: IconSettings, action: () => onNavigate?.('/settings') },
    ],
  }[activeView] || []

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: '1.25rem 1.5rem',
        border: '1px solid #E9E3EE',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1A1A2E' }}>
          Quick Actions:
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
        {actions.map(act => {
          const IconComp = act.icon
          return (
            <button
              key={act.label}
              type="button"
              onClick={act.action}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.95rem',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: act.primary ? 'none' : '1px solid #d0c6d8',
                backgroundColor: act.primary ? '#26C6DA' : '#ffffff',
                color: '#1A1A2E',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <IconComp size={15} />
              {act.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
