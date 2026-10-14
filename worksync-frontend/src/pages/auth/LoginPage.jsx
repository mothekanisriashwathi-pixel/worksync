import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'

const PRESET_ROLES = [
  {
    role: 'ADMIN',
    title: 'Admin',
    name: 'Alex Admin',
    email: 'admin@worksync.com',
    password: 'admin123',
    badgeBg: 'rgba(255, 107, 107, 0.2)',
    badgeColor: '#ff6b6b',
    icon: '👑',
  },
  {
    role: 'MANAGER',
    title: 'Project Lead',
    name: 'Sarah Lead',
    email: 'lead@worksync.com',
    password: 'lead123',
    badgeBg: 'rgba(38, 198, 218, 0.2)',
    badgeColor: '#26C6DA',
    icon: '🚀',
  },
  {
    role: 'MEMBER',
    title: 'Person (Member)',
    name: 'Pavan Member',
    email: 'member@worksync.com',
    password: 'member123',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeColor: '#10b981',
    icon: '👤',
  },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)
      setUser(data)
      navigate('/dashboard')
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Invalid email or password. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function loginAsPreset(userEmail, userPassword) {
    setEmail(userEmail)
    setPassword(userPassword)
    setError('')
    setLoading(true)

    try {
      const data = await login(userEmail, userPassword)
      setUser(data)
      navigate('/dashboard')
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Preset login failed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1A1A2E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        backgroundColor: '#2E3A4B',
        borderRadius: 16,
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 25px rgba(38, 198, 218, 0.1)',
        border: '1px solid #3d4c60',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #26C6DA 0%, #1A1A2E 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A1A2E',
            fontWeight: 800,
            fontSize: '1.5rem',
            marginBottom: '0.85rem',
            boxShadow: '0 4px 14px rgba(38, 198, 218, 0.4)',
          }}>
            W
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
            WorkSync Sign In
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#B0BEC5', margin: 0 }}>
            Choose a role below for instant 1-click login or sign in manually
          </p>
        </div>

        {/* 3 Preset Roles Quick Login */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 700, color: '#26C6DA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            ⚡ 1-Click Role Logins:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {PRESET_ROLES.map(p => (
              <button
                key={p.role}
                type="button"
                disabled={loading}
                onClick={() => loginAsPreset(p.email, p.password)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 10,
                  border: '1px solid #3d4c60',
                  backgroundColor: '#1A1A2E',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ fontSize: '1.35rem' }}>{p.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{p.title}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: p.badgeBg,
                        color: p.badgeColor,
                        border: `1px solid ${p.badgeColor}`,
                      }}>
                        {p.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#B0BEC5', marginTop: 2 }}>{p.email} • {p.password}</div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#1A1A2E',
                  backgroundColor: '#26C6DA',
                  padding: '4px 10px',
                  borderRadius: 6,
                  boxShadow: '0 2px 8px rgba(38, 198, 218, 0.3)',
                }}>
                  Login →
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '1.5rem 0',
          color: '#B0BEC5',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#3d4c60' }} />
          <span>Or sign in with email</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#3d4c60' }} />
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid #f43f5e',
            color: '#fecdd3',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#B0BEC5', marginBottom: '0.4rem' }}>
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. admin@worksync.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #3d4c60',
                fontSize: '0.95rem',
                outline: 'none',
                backgroundColor: '#1A1A2E',
                color: '#ffffff',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#B0BEC5', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                border: '1px solid #3d4c60',
                fontSize: '0.95rem',
                outline: 'none',
                backgroundColor: '#1A1A2E',
                color: '#ffffff',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.85rem',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 700,
              backgroundColor: '#26C6DA',
              color: '#1A1A2E',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              marginTop: '0.5rem',
              boxShadow: '0 4px 16px rgba(38, 198, 218, 0.4)',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#B0BEC5' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#26C6DA', fontWeight: 700, textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
          <Link to="/" style={{ color: '#78909c', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
