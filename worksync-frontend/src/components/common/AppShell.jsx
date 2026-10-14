import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconTeam,
  IconSettings,
  IconClose,
} from './WorkSyncIcons'

/**
 * AppShell — root layout component with automatic react-router-dom navigation.
 */

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  projects:  'Projects',
  tasks:     'Tasks',
  team:      'Team',
  settings:  'Settings',
}

const MOBILE_NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { key: 'projects',  label: 'Projects',  Icon: IconProjects  },
  { key: 'tasks',     label: 'Tasks',     Icon: IconTasks     },
  { key: 'team',      label: 'Team',      Icon: IconTeam      },
  { key: 'settings',  label: 'Settings',  Icon: IconSettings  },
]

function readStorage(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

export default function AppShell({ activePage, onNavigate, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentActivePage = activePage || location.pathname.replace(/^\//, '') || 'dashboard'

  /* Sidebar collapsed state */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = readStorage('ws_sidebar_collapsed', null)
    if (saved !== null) return saved === 'true'
    return window.innerWidth <= 1024
  })

  /* Mobile drawer */
  const [drawerOpen, setDrawerOpen] = useState(false)

  /* Text size */
  const [textSize, setTextSize] = useState(() =>
    readStorage('ws_text_size', 'default')
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize)
    localStorage.setItem('ws_text_size', textSize)
  }, [textSize])

  useEffect(() => {
    localStorage.setItem('ws_sidebar_collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) {
        // mobile
      } else if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setDrawerOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(v => !v)
  }, [])

  const handleNavigate = useCallback((page) => {
    if (typeof onNavigate === 'function') {
      onNavigate(page)
    } else {
      navigate(`/${page}`)
    }
    setDrawerOpen(false)
  }, [onNavigate, navigate])

  const pageTitle = PAGE_TITLES[currentActivePage] ?? 'WorkSync'

  return (
    <div className="app-shell">
      {/* ── Desktop sidebar ── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        activePage={currentActivePage}
        onNavigate={handleNavigate}
      />

      {/* ── Mobile nav drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="nav-drawer-backdrop open"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile nav drawer ── */}
      <nav
        className={`nav-drawer${drawerOpen ? ' open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!drawerOpen}
      >
        <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="sidebar-logo-mark">W</div>
            <span className="sidebar-logo-text">WorkSync</span>
          </div>
          <button
            className="btn-icon"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            style={{ color: 'var(--sidebar-text)' }}
          >
            <IconClose size={20} />
          </button>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-nav-group">
            {MOBILE_NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`sidebar-nav-item${currentActivePage === key ? ' active' : ''}`}
                onClick={() => handleNavigate(key)}
                aria-current={currentActivePage === key ? 'page' : undefined}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <Icon size={20} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main area: header + page content ── */}
      <div className={`main-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Header
          pageTitle={pageTitle}
          onMenuClick={() => setDrawerOpen(true)}
          textSize={textSize}
          onTextSizeChange={setTextSize}
        />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
