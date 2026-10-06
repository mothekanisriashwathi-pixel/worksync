import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconTeam,
  IconSettings,
  IconChevronLeft,
  IconChevronRight,
} from './WorkSyncIcons'

/**
 * Sidebar — desktop fixed/collapsible navigation.
 * No user profile here — that lives in the Header.
 *
 * Props:
 *   collapsed   {boolean}  — controlled collapse state
 *   onToggle    {function} — called when toggle button is clicked
 *   activePage  {string}   — current active nav item key
 *   onNavigate  {function} — called with nav item key on click
 */

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { key: 'projects',  label: 'Projects',  Icon: IconProjects  },
  { key: 'tasks',     label: 'Tasks',     Icon: IconTasks     },
  { key: 'team',      label: 'Team',      Icon: IconTeam      },
  { key: 'settings',  label: 'Settings',  Icon: IconSettings  },
]

export default function Sidebar({ collapsed, onToggle, activePage, onNavigate }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} aria-label="Main navigation">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark" aria-hidden="true">W</div>
        <span className="sidebar-logo-text">WorkSync</span>
      </div>

      {/* Primary nav */}
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <div className="sidebar-nav-group">
          {!collapsed && (
            <span className="sidebar-nav-group-label">Menu</span>
          )}
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <NavItem
              key={key}
              navKey={key}
              label={label}
              Icon={Icon}
              collapsed={collapsed}
              active={activePage === key}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      {/* Spacer pushes toggle to bottom */}
      <div style={{ flex: 1 }} />

      {/* Collapse / expand toggle */}
      <div className="sidebar-toggle">
        <button
          className="btn-icon"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ color: 'var(--sidebar-text)' }}
        >
          {collapsed
            ? <IconChevronRight size={18} />
            : <IconChevronLeft size={18} />
          }
        </button>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* NavItem                                                              */
/* ------------------------------------------------------------------ */

function NavItem({ navKey, label, Icon, collapsed, active, onNavigate }) {
  return (
    <button
      className={`sidebar-nav-item${active ? ' active' : ''}`}
      onClick={() => onNavigate(navKey)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      style={{ width: '100%', textAlign: 'left' }}
    >
      <Icon size={20} className="sidebar-nav-icon" />
      <span className="sidebar-nav-label">{label}</span>
    </button>
  )
}
