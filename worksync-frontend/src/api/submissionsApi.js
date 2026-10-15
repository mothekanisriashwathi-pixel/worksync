import api from './axiosInstance'

/** POST /submissions/task/:id — FormData with optional file, comment, github_url */
export const submitTaskWork = (taskId, formData) =>
  api.post(`/submissions/task/${taskId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

/** GET /submissions — review queue (reviewers) or own submissions (members) */
export const listSubmissions = (status = null) =>
  api.get('/submissions', { params: status ? { status_filter: status } : {} }).then(r => r.data)

export const getSubmission = (submissionId) =>
  api.get(`/submissions/${submissionId}`).then(r => r.data)

/** GET /submissions/task/:id — all revisions for a task, newest first */
export const getTaskSubmissions = (taskId) =>
  api.get(`/submissions/task/${taskId}`).then(r => r.data)

/** PATCH /submissions/:id/review — status: IN_REVIEW | APPROVED | CHANGES_REQUESTED */
export const reviewSubmission = (submissionId, data) =>
  api.patch(`/submissions/${submissionId}/review`, data).then(r => r.data)

/** Fetch the protected attachment with the auth cookie and hand it to the browser as a download. */
export async function downloadSubmissionFile(submission) {
  const res = await api.get(`/submissions/${submission.id}/file`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = submission.original_filename || `submission-${submission.id}`
  a.click()
  URL.revokeObjectURL(url)
}

/** FormData for submitTaskWork; blank fields are omitted. */
export function buildSubmissionForm({ comment, githubUrl, file }) {
  const formData = new FormData()
  if (comment.trim()) formData.append('comment', comment.trim())
  if (githubUrl.trim()) formData.append('github_url', githubUrl.trim())
  if (file) formData.append('file', file)
  return formData
}
