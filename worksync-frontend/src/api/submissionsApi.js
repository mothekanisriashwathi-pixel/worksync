import api from './axiosInstance'

export const submitTaskWork = (taskId, formData) =>
  api.post(`/submissions/task/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

export const getTaskSubmissions = (taskId) =>
  api.get(`/submissions/task/${taskId}`).then(r => r.data)

export const reviewSubmission = (submissionId, data) =>
  api.patch(`/submissions/${submissionId}/review`, data).then(r => r.data)
