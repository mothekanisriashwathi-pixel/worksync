import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login, register } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/common/AuthLayout'
import { errorText } from '../../lib/ui'

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
      setUser(await login(email, password))
      navigate('/dashboard')
    } catch (err) {
      setError(errorText(err, 'Registration failed. Please check your details and try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="New accounts join as members; a lead can add you to a team."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <label className="field">
          <span className="field-label">Full name</span>
          <input className="input" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required autoFocus />
        </label>
        <label className="field">
          <span className="field-label">Email</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} maxLength={72} required aria-describedby="pw-hint" />
          <span className="field-hint" id="pw-hint">At least 8 characters.</span>
        </label>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
