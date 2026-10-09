/**
 * Tasks API — wraps /tasks/* endpoints.
 *
 * Backend response shape (TaskResponse):
 *   { id, title, description, project_id, assigned_to, created_by,
 *     status, priority, due_date }
 *
 * GET /tasks is role-scoped by the backend:
 *   ADMIN   → all tasks
 *   MANAGER → tasks in projects they manage
 *   MEMBER  → tasks assigned to them
 */
import api from './axiosInstance'

/** GET /tasks — returns tasks visible to the current user */
export const getTasks = () => api.get('/tasks').then(r => r.data)

/** PATCH /tasks/:id — partial update (status, priority, etc.) */
export const updateTask = (taskId, data) =>
  api.patch(`/tasks/${taskId}`, data).then(r => r.data)
