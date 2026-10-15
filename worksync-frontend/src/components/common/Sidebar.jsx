import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconTeam,
  IconSettings,
  IconInbox,
  IconChevronLeft,
  IconChevronRight,
} from './WorkSyncIcons'
import { useAuth } from '../../context/AuthContext'
import { initials, ROLE_LABELS } from '../../lib/ui'

/** Single source of navigation for the sidebar, mobile drawer, shortcuts and command palette. */
// eslint-disable-next-line react-refresh/only-export-components
export const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard, shortcut: 'd' },
      { key: 'projects', label: 'Projects', Icon: IconProjects, shortcut: 'p' },
      { key: 'tasks', label: 'Tasks', Icon: IconTasks, shortcut: 't' },
      { key: 'submissions', label: 'Submissions', Icon: IconInbox, shortcut: 's' },
    ],
  },
  {
    label: 'Organization',
    items: [
      { key: 'team', label: 'Team', Icon: IconTeam, shortcut: 'm' },
      { key: 'settings', label: 'Settings', Icon: IconSettings, shortcut: ',' },
    ],
  },
]

export function NavList({ activePage, onNavigate, collapsed = false }) {
  return (
    <nav className="sidebar-nav" aria-label="Primary navigation">
      {NAV_GROUPS.map(group => (
        <div className="sidebar-nav-group" key={group.label} role="group" aria-label={group.label}>
          {!collapsed && <span className="sidebar-nav-group-label">{group.label}</span>}
          {group.items.map(({ key, label, Icon, shortcut }) => (
            <button
              key={key}
              type="button"
              className={`sidebar-nav-item${activePage === key ? ' active' : ''}`}
              onClick={() => onNavigate(key)}
              aria-current={activePage === key ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              data-tooltip={label}
              aria-keyshortcuts={`G ${shortcut.toUpperCase()}`}
            >
              <Icon size={18} className="sidebar-nav-icon" />
              {!collapsed && <span className="sidebar-nav-label">{label}</span>}
              {!collapsed && <kbd aria-hidden="true">G {shortcut.toUpperCase()}</kbd>}
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}

export function SidebarUser({ collapsed }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="sidebar-user" title={collapsed ? `${user.name} · ${ROLE_LABELS[user.role] ?? user.role}` : undefined}>
      <span className="avatar avatar-sm" aria-hidden="true" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(user.name)}</span>
      {!collapsed && (
        <span className="sidebar-user-meta">
          <span className="sidebar-user-name" style={{ display: 'block' }}>{user.name}</span>
          <span className="sidebar-user-role">{ROLE_LABELS[user.role] ?? user.role}</span>
        </span>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark" aria-hidden="true">W</div>
        {!collapsed && <span className="sidebar-logo-text">WorkSync</span>}
      </div>

      <NavList activePage={activePage} onNavigate={onNavigate} collapsed={collapsed} />

      <div style={{ flex: 1 }} />

      <div className="sidebar-footer">
        <SidebarUser collapsed={collapsed} />
        <button
          type="button"
          className="sidebar-nav-item"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          data-tooltip={collapsed ? 'Expand sidebar' : undefined}
        >
          {collapsed ? <IconChevronRight size={18} className="sidebar-nav-icon" /> : <IconChevronLeft size={18} className="sidebar-nav-icon" />}
          {!collapsed && <span className="sidebar-nav-label">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
