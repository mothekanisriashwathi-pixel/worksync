import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar, { NAV_GROUPS, NavList, SidebarUser } from './Sidebar'
import Header from './Header'
import CommandPalette from './CommandPalette'
import { IconClose } from './WorkSyncIcons'

const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items)

/** Pages can add a trailing breadcrumb (e.g. the open project's name). */
const CrumbContext = createContext(() => {})
// eslint-disable-next-line react-refresh/only-export-components
export function usePageCrumb(label) {
  const setCrumb = useContext(CrumbContext)
  useEffect(() => {
    setCrumb(label || null)
    return () => setCrumb(null)
  }, [label, setCrumb])
}

function readStorage(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}

function isTyping(el) {
  return el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export default function AppShell({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const section = location.pathname.split('/')[1] || 'dashboard'
  const navItem = NAV_ITEMS.find(i => i.key === section)

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = readStorage('ws_sidebar_collapsed', null)
    if (saved !== null) return saved === 'true'
    return window.innerWidth <= 1024
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [detailCrumb, setDetailCrumb] = useState(null)
  const pendingG = useRef(0)

  /* Text size preference (Settings page writes the same key) */
  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', readStorage('ws_text_size', 'default'))
  }, [])

  useEffect(() => {
    try { localStorage.setItem('ws_sidebar_collapsed', String(sidebarCollapsed)) } catch { /* ignore */ }
  }, [sidebarCollapsed])

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

  /* New route: start at the top (query-string changes such as filters keep position) */
  useEffect(() => {
    window.scrollTo(0, 0)
    setDrawerOpen(false)
  }, [location.pathname])

  /* Keep the browser tab title meaningful */
  useEffect(() => {
    const parts = [detailCrumb, navItem?.label, 'WorkSync'].filter(Boolean)
    document.title = parts.join(' · ')
  }, [detailCrumb, navItem])

  const handleNavigate = useCallback(page => {
    navigate(`/${page}`)
    setDrawerOpen(false)
  }, [navigate])

  /* Global shortcuts: Ctrl/Cmd+K palette, "g" then a letter to navigate */
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(v => !v)
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || document.querySelector('[aria-modal="true"]')) return
      if (e.key === 'g') {
        pendingG.current = Date.now()
        return
      }
      if (Date.now() - pendingG.current < 1200) {
        const target = NAV_ITEMS.find(i => i.shortcut === e.key.toLowerCase())
        pendingG.current = 0
        if (target) {
          e.preventDefault()
          handleNavigate(target.key)
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleNavigate])

  const crumbs = [
    { label: 'WorkSync', to: '/dashboard' },
    navItem && { label: navItem.label, to: `/${navItem.key}` },
    detailCrumb && { label: detailCrumb },
  ].filter(Boolean)

  return (
    <CrumbContext.Provider value={setDetailCrumb}>
      <div className="app-shell">
        <a href="#main-content" className="sr-only" style={{ zIndex: 100 }} onFocus={e => e.currentTarget.classList.remove('sr-only')} onBlur={e => e.currentTarget.classList.add('sr-only')}>
          Skip to content
        </a>

        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
          activePage={section}
          onNavigate={handleNavigate}
        />

        {drawerOpen && <div className="nav-drawer-backdrop open" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}

        <nav className={`nav-drawer${drawerOpen ? ' open' : ''}`} aria-label="Mobile navigation" aria-hidden={!drawerOpen} inert={drawerOpen ? undefined : ''}>
          <div className="sidebar-logo" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="sidebar-logo-mark" aria-hidden="true">W</div>
              <span className="sidebar-logo-text">WorkSync</span>
            </div>
            <button className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" style={{ color: 'var(--sidebar-text)' }}>
              <IconClose size={18} />
            </button>
          </div>
          <NavList activePage={section} onNavigate={handleNavigate} />
          <div style={{ flex: 1 }} />
          <div className="sidebar-footer"><SidebarUser /></div>
        </nav>

        <div className={`main-wrapper${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <Header crumbs={crumbs} onMenuClick={() => setDrawerOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
          <main id="main-content" className="page-content" tabIndex={-1}>
            <div key={location.pathname} className="page-enter">{children}</div>
          </main>
        </div>

        {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      </div>
    </CrumbContext.Provider>
  )
}
