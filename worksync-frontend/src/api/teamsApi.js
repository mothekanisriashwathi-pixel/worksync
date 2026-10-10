import api from './axiosInstance'

export const getTeams = () => api.get('/teams').then(r => r.data)
export const getTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`).then(r => r.data)
