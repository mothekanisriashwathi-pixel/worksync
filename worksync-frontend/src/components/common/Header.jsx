import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  IconMenu,
  IconSearch,
  IconNotifications,
  IconSettings,
  IconHelp,
  IconLogout,
  IconSun,
  IconMoon,
} from './WorkSyncIcons'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { logout } from '../../api/authApi'
import { getNotifications, markNotificationRead } from '../../api/notificationsApi'
import { Dialog } from '../ui/Primitives'
import { initials, ROLE_LABELS, timeAgo } from '../../lib/ui'

const SUBMISSION_TYPES = new Set([
  'SUBMISSION_RECEIVED', 'RESUBMISSION_RECEIVED', 'SUBMISSION_IN_REVIEW', 'SUBMISSION_APPROVED', 'CHANGES_REQUESTED',
])

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export default function Header({ crumbs, onMenuClick, onOpenPalette }) {
  const { user, clearUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  /* Load real notifications on mount and whenever the panel opens */
  useEffect(() => {
    if (!user) return
    getNotifications()
      .then(list => setNotifications((list || []).slice(0, 20)))
      .catch(() => {})
  }, [user, notifOpen])

  /* The command palette can open the notification panel */
  useEffect(() => {
    const open = () => { setNotifOpen(true); setProfileOpen(false) }
    window.addEventListener('ws:open-notifications', open)
    return () => window.removeEventListener('ws:open-notifications', open)
  }, [])

  /* Close menus on outside click / Escape */
  useEffect(() => {
    function onClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') { setNotifOpen(false); setProfileOpen(false) }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function markRead(ids) {
    setNotifications(prev => prev.map(n => (ids.includes(n.id) ? { ...n, is_read: true } : n)))
    ids.forEach(id => markNotificationRead(id).catch(() => {}))
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // network errors still log the user out locally
    } finally {
      clearUser()
      navigate('/login')
    }
  }

  return (
    <header className="header">
      <div className="header-left" style={{ minWidth: 0 }}>
        <button className="hamburger-btn icon-btn" onClick={onMenuClick} aria-label="Open navigation menu">
          <IconMenu size={20} />
        </button>
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {i > 0 && <span className="crumb-sep" aria-hidden="true">/</span>}
              {c.to && i < crumbs.length - 1
                ? <Link to={c.to}>{c.label}</Link>
                : <span className={i === crumbs.length - 1 ? 'crumb-current' : undefined} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
            </span>
          ))}
        </nav>
      </div>

      <div className="header-right" style={{ gap: 6 }}>
        <button type="button" className="search-trigger" onClick={onOpenPalette} aria-label="Search and run commands" aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}>
          <IconSearch size={15} />
          <span className="search-trigger-label">Search or jump to…</span>
          <kbd aria-hidden="true">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <IconSun size={17} /> : <IconMoon size={17} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notifOpen}
            aria-haspopup="true"
            title="Notifications"
          >
            <IconNotifications size={17} />
            {unreadCount > 0 && <span className="dot" aria-hidden="true" />}
          </button>

          {notifOpen && (
            <div className="notification-panel" role="region" aria-label="Notifications">
              <div className="notification-panel-header">
                <span className="notification-panel-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markRead(notifications.filter(n => !n.is_read).map(n => n.id))}>
                    Mark all read
                  </button>
                )}
              </div>
              <ul className="notification-list" role="list">
                {notifications.length === 0 && (
                  <li className="notification-item">
                    <div className="notification-item-body">
                      <p className="notification-item-message">You&apos;re all caught up.</p>
                    </div>
                  </li>
                )}
                {notifications.map(n => (
                  <li key={n.id} className={`notification-item${!n.is_read ? ' unread' : ''}`}>
                    <button
                      type="button"
                      style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', color: 'inherit' }}
                      onClick={() => {
                        if (!n.is_read) markRead([n.id])
                        if (SUBMISSION_TYPES.has(n.type)) {
                          setNotifOpen(false)
                          navigate('/submissions')
                        }
                      }}
                    >
                      {!n.is_read && <span className="notification-item-dot" aria-label="Unread" />}
                      <span className="notification-item-body">
                        <span className="notification-item-message" style={{ display: 'block' }}>{n.message}</span>
                        <span className="notification-item-time" style={{ display: 'block' }}>{timeAgo(n.created_at)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            className="avatar avatar-sm"
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            style={{ cursor: 'pointer', width: 30, height: 30, fontSize: 11 }}
          >
            {initials(user?.name)}
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu" aria-label="Profile menu">
              <div className="profile-menu-header">
                <p className="profile-menu-name">{user?.name}</p>
                <p className="profile-menu-role">{user?.email}</p>
                <span className="badge badge-info" style={{ marginTop: 6 }}>{ROLE_LABELS[user?.role] ?? user?.role}</span>
              </div>
              <button className="profile-menu-item" role="menuitem" onClick={() => { setProfileOpen(false); navigate('/settings') }}>
                <IconSettings size={16} /> Settings
              </button>
              <button className="profile-menu-item" role="menuitem" onClick={() => { setProfileOpen(false); setHelpOpen(true) }}>
                <IconHelp size={16} /> Help &amp; shortcuts
              </button>
              <div className="profile-menu-divider" role="separator" />
              <button className="profile-menu-item danger" role="menuitem" onClick={handleLogout}>
                <IconLogout size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {helpOpen && (
        <Dialog
          title="Help & keyboard shortcuts"
          onClose={() => setHelpOpen(false)}
          footer={<button className="btn btn-primary" onClick={() => setHelpOpen(false)} data-autofocus>Got it</button>}
        >
          <dl className="meta-grid" style={{ gridTemplateColumns: '140px 1fr' }}>
            <dt><kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd></dt><dd>Search projects and tasks, run commands</dd>
            <dt><kbd>G</kbd> then <kbd>D</kbd>/<kbd>P</kbd>/<kbd>T</kbd>/<kbd>S</kbd>/<kbd>M</kbd></dt><dd>Go to Dashboard, Projects, Tasks, Submissions, Team</dd>
            <dt><kbd>Esc</kbd></dt><dd>Close dialogs, drawers and menus</dd>
          </dl>
          <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>
            API reference: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">FastAPI /docs</a>
          </p>
        </Dialog>
      )}
    </header>
  )
}
