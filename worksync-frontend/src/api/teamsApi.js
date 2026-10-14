import api from './axiosInstance'

export const getTeams = () => api.get('/teams').then(r => r.data)
export const createTeam = (data) => api.post('/teams', data).then(r => r.data)
export const updateTeam = (teamId, data) => api.patch(`/teams/${teamId}`, data).then(r => r.data)
export const deleteTeam = (teamId) => api.delete(`/teams/${teamId}`).then(r => r.data)

export const getTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`).then(r => r.data)
export const addTeamMember = (teamId, data) => api.post(`/teams/${teamId}/members`, data).then(r => r.data)
export const removeTeamMember = (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`).then(r => r.data)

