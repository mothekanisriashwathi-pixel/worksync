import api from './axiosInstance'

/** GET /projects — returns projects visible to current user */
export const getProjects = () => api.get('/projects').then(r => r.data)

/** GET /projects/:id — returns individual project details */
export const getProject = (projectId) => api.get(`/projects/${projectId}`).then(r => r.data)

/** POST /projects — create a new project */
export const createProject = (data) => api.post('/projects', data).then(r => r.data)

/** PATCH /projects/:id — update project */
export const updateProject = (projectId, data) => api.patch(`/projects/${projectId}`, data).then(r => r.data)

/** DELETE /projects/:id — delete project */
export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`).then(r => r.data)

/** POST /projects/:id/github — link or update GitHub repo */
export const linkProjectGithub = (projectId, githubRepoUrl) =>
  api.post(`/projects/${projectId}/github`, { github_repo_url: githubRepoUrl }).then(r => r.data)

/** DELETE /projects/:id/github — unlink GitHub repo */
export const unlinkProjectGithub = (projectId) =>
  api.delete(`/projects/${projectId}/github`).then(r => r.data)

/** GET /projects/:id/github/repo — get live GitHub repo metadata */
export const getProjectGithubRepo = (projectId) =>
  api.get(`/projects/${projectId}/github/repo`).then(r => r.data)

/** GET /projects/:id/github/commits — get live GitHub commits */
export const getProjectGithubCommits = (projectId) =>
  api.get(`/projects/${projectId}/github/commits`).then(r => r.data)

