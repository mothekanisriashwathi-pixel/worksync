import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconMenu,
  IconSearch,
  IconNotifications,
  IconProfile,
  IconSettings,
  IconHelp,
  IconLogout,
  IconClose,
} from './WorkSyncIcons'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../api/authApi'

const INITIAL_NOTIFICATIONS = [
  { id: 1, message: 'Alex assigned you a new task: "Update API docs"', time: '2 min ago', unread: true },
  { id: 2, message: 'Jordan left a comment on "Dashboard redesign"', time: '18 min ago', unread: true },
  { id: 3, message: 'Sprint 4 project deadline is tomorrow', time: '1 hr ago', unread: true },
  { id: 4, message: 'Your submission on "Fix login bug" was approved', time: '3 hrs ago', unread: false },
  { id: 5, message: 'Taylor joined your team', time: 'Yesterday', unread: false },
]

export default function Header({ pageTitle, onMenuClick, textSize, onTextSizeChange }) {
  const { user, clearUser } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [notifOpen, setNotifOpen]         = useState(false)
  const [profileOpen, setProfileOpen]     = useState(false)
  const [searchOpen, setSearchOpen]       = useState(false)
  const [searchValue, setSearchValue]     = useState('')
  const [helpOpen, setHelpOpen]           = useState(false)

  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifications.filter(n => n.unread).length

  // Calculate initials from user name
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SA'

  /* Close dropdowns when clicking outside */
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Close on Escape */
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        setNotifOpen(false)
        setProfileOpen(false)
        setSearchOpen(false)
        setHelpOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore network errors
    } finally {
      clearUser()
      navigate('/login')
    }
  }

  function handleMarkAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  function handleSearchSubmit(e) {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchValue.trim())}`)
      setSearchOpen(false)
    }
  }

  return (
    <header className="header">
      {/* Left: hamburger (mobile) + page title */}
      <div className="header-left">
        <button
          className="hamburger-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <IconMenu size={22} />
        </button>
        <h1 className="header-page-title">{pageTitle}</h1>
      </div>

      {/* Right: search · notifications · avatar */}
      <div className="header-right">

        {/* Search */}
        <div className="header-search">
          {searchOpen ? (
            <div className="input-search-wrapper">
              <IconSearch size={16} className="search-icon" />
              <input
                className="input input-search"
                placeholder="Search tasks, projects, people… (press Enter)"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearchSubmit}
                autoFocus
                aria-label="Search"
                style={{ width: 260 }}
              />
              <button
                className="btn-icon"
                style={{ marginLeft: 'var(--space-1)' }}
                onClick={() => { setSearchOpen(false); setSearchValue('') }}
                aria-label="Close search"
              >
                <IconClose size={16} />
              </button>
            </div>
          ) : (
            <button
              className="header-icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
              title="Search"
            >
              <IconSearch size={18} />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="header-icon-btn"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ''}`}
            aria-expanded={notifOpen}
            title="Notifications"
          >
            <IconNotifications size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge" aria-hidden="true" />
            )}
          </button>

          {notifOpen && (
            <div className="notification-panel" role="region" aria-label="Notifications panel">
              <div className="notification-panel-header">
                <span className="notification-panel-title">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    className="btn btn-tertiary btn-sm"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <ul className="notification-list" role="list">
                {notifications.map(n => (
                  <li
                    key={n.id}
                    className={`notification-item${n.unread ? ' unread' : ''}`}
                    role="listitem"
                    onClick={() => {
                      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item))
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {n.unread && (
                      <span className="notification-item-dot" aria-hidden="true" />
                    )}
                    <div className="notification-item-body">
                      <p className="notification-item-message">{n.message}</p>
                      <p className="notification-item-time">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
              }}>
                <button
                  className="btn btn-tertiary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => {
                    handleMarkAllRead()
                    setNotifOpen(false)
                  }}
                >
                  Clear all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar + profile menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            className="avatar avatar-sm"
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            title="My profile"
            style={{ cursor: 'pointer', border: 'none' }}
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu" aria-label="Profile menu">
              {/* User info */}
              <div className="profile-menu-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="avatar avatar-md" aria-hidden="true">{initials}</div>
                  <div>
                    <p className="profile-menu-name">{user?.name || 'Sri Ashwathi'}</p>
                    <p className="profile-menu-role">{user?.role ? `${user.role.charAt(0) + user.role.slice(1).toLowerCase()} Account` : 'Team Manager'}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div role="none">
                <button
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/settings')
                  }}
                >
                  <IconProfile size={16} />
                  My Profile
                </button>
                <button
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/settings')
                  }}
                >
                  <IconSettings size={16} />
                  Account Settings
                </button>
                <button
                  className="profile-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false)
                    setHelpOpen(true)
                  }}
                >
                  <IconHelp size={16} />
                  Help &amp; Support
                </button>
              </div>

              <div className="profile-menu-divider" role="separator" />

              <div role="none">
                <button
                  className="profile-menu-item danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <IconLogout size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 460,
            width: '90%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>
              WorkSync Help & Support
            </h3>
            <p style={{ color: '#4e4059', fontSize: '0.925rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Welcome to WorkSync! Use the sidebar navigation on the left to manage Projects, track Tasks, and view Team activity.
              For API endpoints, check out the FastAPI docs at <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" style={{ color: '#00acc1', fontWeight: 700 }}>/docs</a>.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, backgroundColor: '#26C6DA', color: '#1A1A2E', fontWeight: 700 }}
              onClick={() => setHelpOpen(false)}
            >
              Got it, close
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
