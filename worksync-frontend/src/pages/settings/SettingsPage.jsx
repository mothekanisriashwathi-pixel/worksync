import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { logout } from '../../api/authApi'
import { IconLogout } from '../../components/common/WorkSyncIcons'

export default function SettingsPage() {
  const { user, clearUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [textSize, setTextSize] = useState(() => localStorage.getItem('ws_text_size') || 'default')

  function handleTextSizeChange(val) {
    setTextSize(val)
    document.documentElement.setAttribute('data-text-size', val)
    localStorage.setItem('ws_text_size', val)
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore
    } finally {
      clearUser()
      navigate('/login')
    }
  }

  return (
    <div style={{ maxWidth: 760, paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">
          Settings
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Manage your account profile, preferences, and workspace settings
        </p>
      </div>

      {/* Profile Form Card */}
      <div style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        padding: '2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-primary)' }}>
          Personal Information
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '-0.5rem 0 1.25rem 0' }}>
          Profile details are managed by an administrator.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <input
              type="text"
              readOnly
              value={user?.name || ''}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              type="email"
              readOnly
              value={user?.email || ''}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              Role
            </label>
            <input
              type="text"
              readOnly
              value={user?.role || ''}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

        </div>
      </div>

      {/* Appearance Settings */}
      <div style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 12,
        border: '1px solid var(--border-color)',
        padding: '2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-primary)' }}>
          Appearance
        </h2>
        <div className="form-grid">
          <div className="field">
            <span className="field-label" id="theme-label">Theme</span>
            <div className="segmented" role="group" aria-labelledby="theme-label" style={{ alignSelf: 'flex-start' }}>
              <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Light</button>
              <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Dark</button>
            </div>
          </div>
          <div className="field">
            <span className="field-label" id="size-label">Text size</span>
            <div className="segmented" role="group" aria-labelledby="size-label" style={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
              {[['small', 'Small'], ['default', 'Default'], ['large', 'Large'], ['xlarge', 'Extra large']].map(([size, label]) => (
                <button key={size} type="button" aria-pressed={textSize === size} onClick={() => handleTextSizeChange(size)}>{label}</button>
              ))}
            </div>
          </div>
          <span className="field-hint">Saved on this device. Press Ctrl/⌘ K anywhere to switch theme from the command palette.</span>
        </div>
      </div>

      {/* Sign Out Card */}
      <div style={{
        backgroundColor: 'var(--surface-card)',
        borderRadius: 12,
        border: '1px solid var(--danger-soft)',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--danger-text)' }}>
          Session Management
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Log out of this device. You will need to sign in again to access projects and tasks.
        </p>
        <button
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
            backgroundColor: 'var(--danger-soft)',
            color: 'var(--danger-text)',
            border: '1px solid var(--danger-soft)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <IconLogout size={18} />
          Sign Out of WorkSync
        </button>
      </div>
    </div>
  )
}
