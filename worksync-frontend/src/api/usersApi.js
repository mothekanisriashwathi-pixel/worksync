import api from './axiosInstance'

// ADMIN only — callers handle 403
export const getUsers = () => api.get('/users').then(r => r.data)
