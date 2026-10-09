/**
 * Shared Axios instance for all WorkSync API calls.
 *
 * - Base URL comes from VITE_API_BASE_URL in .env (default: http://localhost:8000)
 * - withCredentials: true sends the HTTP-only access_token cookie automatically
 * - The Vite dev proxy (vite.config.js) forwards /api/* to FastAPI, so the
 *   cookie is sent on the same origin and SameSite=lax works without CORS issues.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  withCredentials: true,          // send/receive HTTP-only cookie on every request
  headers: { 'Content-Type': 'application/json' },
})

export default api
