/**
 * AuthContext — global authentication state.
 *
 * On mount, calls GET /auth/me to check whether a valid HTTP-only cookie
 * already exists (e.g. from a previous session). The result is stored in
 * context and made available to every component via useAuth().
 *
 * Provided values:
 *   user      {object|null}  — { id, name, email, role, is_active } or null
 *   role      {string|null}  — 'ADMIN' | 'MANAGER' | 'MEMBER' | null
 *   loading   {boolean}      — true while the initial /auth/me call is in-flight
 *   setUser   {function}     — update user after login
 *   clearUser {function}     — clear user after logout
 */
import { createContext, useContext, useEffect, useState } from 'react'
import { getMe } from '../api/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for an existing session when the app first loads.
  useEffect(() => {
    getMe()
      .then(data => setUser(data))
      .catch(() => setUser(null))   // 401 = not logged in; any other error = treat as logged out
      .finally(() => setLoading(false))
  }, [])

  function clearUser() {
    setUser(null)
  }

  const value = {
    user,
    role:      user?.role ?? null,
    loading,
    setUser,
    clearUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/** Convenience hook — throws if used outside <AuthProvider> */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
