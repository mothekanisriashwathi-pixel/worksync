import api from './axiosInstance'

/** GET /tasks — returns tasks visible to current user, optionally filtered by project */
export const getTasks = (projectId = null) =>
  api.get('/tasks', { params: projectId ? { project_id: projectId } : {} }).then(r => r.data)

/** GET /tasks/:id — returns individual task details */
export const getTask = (taskId) => api.get(`/tasks/${taskId}`).then(r => r.data)

/** POST /tasks — create a new task */
export const createTask = (data) => api.post('/tasks', data).then(r => r.data)

/** PATCH /tasks/:id — update task */
export const updateTask = (taskId, data) => api.patch(`/tasks/${taskId}`, data).then(r => r.data)

/** DELETE /tasks/:id — delete task */
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`).then(r => r.data)

/** PATCH /tasks/:id — update task status convenience helper */
export const updateTaskStatus = (taskId, status) =>
  api.patch(`/tasks/${taskId}`, { status }).then(r => r.data)

