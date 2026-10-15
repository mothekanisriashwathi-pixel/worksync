import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/common/AuthLayout'
import { errorText, ROLE_LABELS } from '../../lib/ui'

// Demo accounts the backend seeds only when APP_ENV=development; hidden from production builds
// unless VITE_SHOW_DEMO_LOGINS=true is set for a demo deployment.
const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true'
const DEMO_ACCOUNTS = [
  { role: 'ADMIN', name: 'Alex Admin', email: 'admin@worksync.com', password: 'admin123' },
  { role: 'MANAGER', name: 'Sarah Lead', email: 'lead@worksync.com', password: 'lead123' },
  { role: 'MEMBER', name: 'Pavan Member', email: 'member@worksync.com', password: 'member123' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(null) // email being signed in, or 'form'
  const { setUser } = useAuth()
  const navigate = useNavigate()

  async function signIn(mail, pass, source) {
    setError('')
    setLoading(source)
    try {
      setUser(await login(mail, pass))
      navigate('/dashboard')
    } catch (err) {
      setError(errorText(err, 'Invalid email or password. Please try again.'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back to your workspace."
      footer={<>New to WorkSync? <Link to="/register">Create an account</Link> · <Link to="/">Back to home</Link></>}
    >
      <form onSubmit={e => { e.preventDefault(); signIn(email, password, 'form') }} className="form-grid">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <label className="field">
          <span className="field-label">Email</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary btn-lg" disabled={Boolean(loading)} style={{ width: '100%' }}>
          {loading === 'form' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {SHOW_DEMO && <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span className="field-label">Demo accounts</span>
          <span style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          <span className="faint" style={{ fontSize: 11.5 }}>development only</span>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {DEMO_ACCOUNTS.map(a => (
            <button
              key={a.email}
              type="button"
              className="panel panel-interactive"
              disabled={Boolean(loading)}
              onClick={() => signIn(a.email, a.password, a.email)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
            >
              <span className="avatar-xs" aria-hidden="true">{a.name.split(' ').map(w => w[0]).join('')}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{a.name}</span>
                <span className="faint mono" style={{ fontSize: 11.5 }}>{a.email}</span>
              </span>
              <span className="badge">{loading === a.email ? 'Signing in…' : ROLE_LABELS[a.role]}</span>
            </button>
          ))}
        </div>
      </div>}
    </AuthLayout>
  )
}
