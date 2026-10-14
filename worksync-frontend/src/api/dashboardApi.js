import api from './axiosInstance'

/**
 * GET /dashboard/summary
 * Retrieves database-backed metrics, task distributions, project health,
 * workload, review queue, and platform overview scoped to the authenticated user's role.
 *
 * @param {string} [view] - Optional view to switch to if authorized ('member' | 'team_lead' | 'manager' | 'admin')
 */
export const getDashboardSummary = (view) =>
  api.get('/dashboard/summary', { params: view ? { view } : {} }).then(r => r.data)
