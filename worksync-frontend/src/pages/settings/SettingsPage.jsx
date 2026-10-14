import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../api/authApi'
import { IconLogout } from '../../components/common/WorkSyncIcons'

export default function SettingsPage() {
  const { user, clearUser } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || 'Sri Ashwathi')
  const [email, setEmail] = useState(user?.email || 'sri@worksync.com')
  const [saved, setSaved] = useState(false)
  const [textSize, setTextSize] = useState(() => localStorage.getItem('ws_text_size') || 'default')

  function handleSave(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

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
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A2E', margin: '0 0 0.35rem 0' }}>
          Settings
        </h1>
        <p style={{ margin: 0, color: '#777184', fontSize: '0.95rem' }}>
          Manage your account profile, preferences, and workspace settings
        </p>
      </div>

      {saved && (
        <div style={{
          backgroundColor: '#dcfce7',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          padding: '0.75rem 1rem',
          borderRadius: 8,
          marginBottom: '1.5rem',
          fontWeight: 600,
        }}>
          ✓ Settings saved successfully!
        </div>
      )}

      {/* Profile Form Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #E9E3EE',
        padding: '2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#1A1A2E' }}>
          Personal Information
        </h2>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#342944', marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #d0c6d8',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#342944', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #d0c6d8',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#342944', marginBottom: '0.4rem' }}>
              Role
            </label>
            <input
              type="text"
              readOnly
              value={user?.role || 'MANAGER'}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #E9E3EE',
                backgroundColor: '#f5f0f0',
                color: '#777184',
                fontSize: '0.95rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                backgroundColor: '#26C6DA',
                color: '#1A1A2E',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(38, 198, 218, 0.3)',
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Appearance Settings */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #E9E3EE',
        padding: '2rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: '#1A1A2E' }}>
          Appearance & Text Size
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {['small', 'default', 'large', 'xlarge'].map(size => (
            <button
              key={size}
              onClick={() => handleTextSizeChange(size)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: 8,
                border: textSize === size ? '2px solid #26C6DA' : '1px solid #d0c6d8',
                backgroundColor: textSize === size ? 'rgba(38, 198, 218, 0.15)' : '#ffffff',
                color: textSize === size ? '#0097a7' : '#1A1A2E',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        border: '1px solid #fee2e2',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#b91c1c' }}>
          Session Management
        </h2>
        <p style={{ color: '#777184', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
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
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
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
