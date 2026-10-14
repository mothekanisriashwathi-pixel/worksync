import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
      const userData = await login(email, password)
      setUser(userData)
      navigate('/dashboard')
    } catch (err) {
      const message = err.response?.data?.detail ?? 'Registration failed. Please check your information and try again.'
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
        maxWidth: 450,
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
            Create Your Account
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#B0BEC5', margin: 0 }}>
            Join WorkSync to collaborate with teams and track projects
          </p>
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
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={e => setName(e.target.value)}
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
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="alex@company.com"
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
              Password (min. 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#B0BEC5' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#26C6DA', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
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
