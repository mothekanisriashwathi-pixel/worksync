/**
 * Projects API — wraps /projects/* endpoints.
 *
 * Backend response shape (ProjectResponse):
 *   { id, name, description, team_id, manager_id,
 *     status, start_date, due_date }
 *
 * GET /projects is role-scoped by the backend:
 *   ADMIN   → all projects
 *   MANAGER → projects they manage
 *   MEMBER  → projects belonging to their team
 *
 * NOTE: ProjectResponse does NOT include task counts or progress.
 *       Those are derived client-side from the tasks list.
 */
import api from './axiosInstance'

/** GET /projects — returns projects visible to the current user */
export const getProjects = () => api.get('/projects').then(r => r.data)
