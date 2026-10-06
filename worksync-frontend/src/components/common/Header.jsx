import { useState, useRef, useEffect } from 'react'
import {
  IconMenu,
  IconSearch,
  IconNotifications,
  IconProfile,
  IconSettings,
  IconAppearance,
  IconHelp,
  IconLogout,
  IconClose,
  IconCheck,
  IconTextSize,
} from './WorkSyncIcons'

/**
 * Header — sticky top bar.
 *
 * Top-right: search · notifications · user avatar → profile menu
 * User profile is NEVER in the sidebar.
 *
 * Props:
 *   pageTitle       {string}
 *   onMenuClick     {function}  — opens mobile nav drawer
 *   textSize        {string}    — 'small'|'default'|'large'|'xlarge'
 *   onTextSizeChange{function}  — called with new size string
 */

const TEXT_SIZE_OPTIONS = [
  { key: 'small',   label: 'Small' },
  { key: 'default', label: 'Default' },
  { key: 'large',   label: 'Large' },
  { key: 'xlarge',  label: 'Extra Large' },
]

const DEMO_NOTIFICATIONS = [
  { id: 1, message: 'Alex assigned you a new task: "Update API docs"', time: '2 min ago', unread: true },
  { id: 2, message: 'Jordan left a comment on "Dashboard redesign"', time: '18 min ago', unread: true },
  { id: 3, message: 'Sprint 4 project deadline is tomorrow', time: '1 hr ago', unread: true },
  { id: 4, message: 'Your submission on "Fix login bug" was approved', time: '3 hrs ago', unread: false },
  { id: 5, message: 'Taylor joined your team', time: 'Yesterday', unread: false },
]

export default function Header({ pageTitle, onMenuClick, textSize, onTextSizeChange }) {
  const [notifOpen, setNotifOpen]       = useState(false)
  const [profileOpen, setProfileOpen]   = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchValue, setSearchValue]   = useState('')

  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = DEMO_NOTIFICATIONS.filter(n => n.unread).length

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
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

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
                placeholder="Search tasks, projects, people…"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                autoFocus
                aria-label="Search"
                style={{ width: 240 }}
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
            <div className="notification-panel" role="dialog" aria-label="Notifications">
              <div className="notification-panel-header">
                <span className="card-title" style={{ fontSize: 'var(--fs-base)' }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button className="btn btn-tertiary btn-sm">
                    Mark all read
                  </button>
                )}
              </div>

              <ul className="notification-list" role="list">
                {DEMO_NOTIFICATIONS.map(n => (
                  <li
                    key={n.id}
                    className={`notification-item${n.unread ? ' unread' : ''}`}
                    role="listitem"
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
                <button className="btn btn-tertiary btn-sm" style={{ width: '100%' }}>
                  View all notifications
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
            SA
          </button>

          {profileOpen && (
            <div className="profile-menu" role="menu" aria-label="Profile menu">
              {/* User info */}
              <div className="profile-menu-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="avatar avatar-md" aria-hidden="true">SA</div>
                  <div>
                    <p className="profile-menu-name">Sri Ashwathi</p>
                    <p className="profile-menu-role">Team Manager</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div role="none">
                <button className="profile-menu-item" role="menuitem">
                  <IconProfile size={16} />
                  My Profile
                </button>
                <button className="profile-menu-item" role="menuitem">
                  <IconSettings size={16} />
                  Account Settings
                </button>

                {/* Appearance / text size submenu inline */}
                <div className="profile-menu-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <IconAppearance size={16} />
                    <span>Text Size</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 'var(--space-1)',
                    paddingLeft: 'calc(16px + var(--space-3))',
                    flexWrap: 'wrap',
                  }}>
                    {TEXT_SIZE_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => onTextSizeChange(opt.key)}
                        role="menuitemradio"
                        aria-checked={textSize === opt.key}
                        style={{
                          padding: '3px var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 'var(--font-medium)',
                          border: '1px solid',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          backgroundColor: textSize === opt.key
                            ? 'var(--color-primary-500)'
                            : 'var(--surface-sunken)',
                          borderColor: textSize === opt.key
                            ? 'var(--color-primary-500)'
                            : 'var(--border-color)',
                          color: textSize === opt.key
                            ? 'white'
                            : 'var(--text-secondary)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="profile-menu-item" role="menuitem">
                  <IconHelp size={16} />
                  Help &amp; Support
                </button>
              </div>

              <div className="profile-menu-divider" role="separator" />

              <div role="none">
                <button className="profile-menu-item danger" role="menuitem">
                  <IconLogout size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
