import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconTeam,
  IconSettings,
  IconClose,
  IconMenu,
} from './WorkSyncIcons'

/**
 * AppShell — root layout component.
 *
 * Responsibilities:
 *  - Owns sidebar collapsed state (desktop)
 *  - Owns mobile nav drawer open state
 *  - Owns text-size preference (applies data-text-size to <html>)
 *  - Renders desktop sidebar, mobile drawer, header, and main content
 *  - Passes active page + navigate handler down to sidebar
 *
 * Props:
 *   activePage  {string}    — current page key
 *   onNavigate  {function}  — called with page key
 *   children    {ReactNode} — page content
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

/* Read persisted preferences from localStorage */
function readStorage(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

export default function AppShell({ activePage, onNavigate, children }) {
  /* Sidebar: default collapsed on tablet (≤1024px), expanded on desktop */
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

  /* Apply text size to <html> element */
  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize)
    localStorage.setItem('ws_text_size', textSize)
  }, [textSize])

  /* Persist sidebar state */
  useEffect(() => {
    localStorage.setItem('ws_sidebar_collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  /* Auto-collapse sidebar on resize to tablet, restore on desktop */
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 768) {
        /* Mobile: sidebar hidden via CSS, close drawer if open */
      } else if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* Close mobile drawer on wider screens */
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setDrawerOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* Trap body scroll when drawer is open on mobile */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed(v => !v)
  }, [])

  const handleNavigate = useCallback((page) => {
    onNavigate(page)
    setDrawerOpen(false)   /* close mobile drawer on navigation */
  }, [onNavigate])

  const pageTitle = PAGE_TITLES[activePage] ?? 'WorkSync'

  return (
    <div className="app-shell">

      {/* ── Desktop / tablet sidebar ── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        activePage={activePage}
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
        {/* Drawer header */}
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

        {/* Drawer nav items */}
        <div className="sidebar-nav">
          <div className="sidebar-nav-group">
            {MOBILE_NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`sidebar-nav-item${activePage === key ? ' active' : ''}`}
                onClick={() => handleNavigate(key)}
                aria-current={activePage === key ? 'page' : undefined}
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

        <main
          className="page-content"
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
