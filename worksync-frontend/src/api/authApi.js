/**
 * Auth API — wraps /auth/* endpoints.
 * Cookie is managed automatically by the browser; no token handling here.
 */
import api from './axiosInstance'

/** GET /auth/me — returns the authenticated user or throws 401 */
export const getMe = () => api.get('/auth/me').then(r => r.data)

/** POST /auth/login — sets the HTTP-only cookie on success */
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

/** POST /auth/logout — clears the HTTP-only cookie */
export const logout = () => api.post('/auth/logout')
