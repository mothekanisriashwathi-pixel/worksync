// Shared non-component helpers for the workspace UI.

export const TASK_STATUSES = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'IN_REVIEW', label: 'In Review' },
  { id: 'COMPLETED', label: 'Completed' },
]

export const PRIORITIES = [
  { id: 'URGENT', label: 'Urgent', level: 3 },
  { id: 'HIGH', label: 'High', level: 3 },
  { id: 'MEDIUM', label: 'Medium', level: 2 },
  { id: 'LOW', label: 'Low', level: 1 },
]

export const PROJECT_STATUSES = [
  { id: 'PLANNING', label: 'Planning', badge: 'badge-todo' },
  { id: 'IN_PROGRESS', label: 'In Progress', badge: 'badge-inprogress' },
  { id: 'ON_HOLD', label: 'On Hold', badge: 'badge-warning' },
  { id: 'COMPLETED', label: 'Completed', badge: 'badge-success' },
]

export const statusLabel = id => TASK_STATUSES.find(s => s.id === id)?.label ?? id
export const priorityMeta = id => PRIORITIES.find(p => p.id === id) ?? { id, label: id, level: 1 }
export const projectStatusMeta = id => PROJECT_STATUSES.find(s => s.id === id) ?? { id, label: id, badge: 'badge-todo' }

export function errorText(err, fallback) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  return fallback
}

/** Parse a backend date ("2026-10-15" or naive UTC datetime) without timezone surprises. */
export function parseDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`)
}

export function formatDay(value) {
  const d = parseDate(value)
  return d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }) : '—'
}

export function timeAgo(value) {
  const d = parseDate(value)
  if (!d) return ''
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return formatDay(value)
}

function startOfToday() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return t
}

export function isOverdue(task) {
  const d = parseDate(task.due_date)
  return Boolean(d && task.status !== 'COMPLETED' && d < startOfToday())
}

/** Days until due (negative when overdue); null without a due date. */
export function daysUntil(value) {
  const d = parseDate(value)
  return d ? Math.round((d - startOfToday()) / 86400000) : null
}

/** Share of tasks completed, or null when the project has no tasks (avoid a misleading 0%). */
export function progressOf(tasks) {
  if (!tasks.length) return null
  return Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)
}

export const initials = name =>
  (name || '?').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

export const canManageRole = role => role === 'ADMIN' || role === 'MANAGER'

export const ROLE_LABELS = { ADMIN: 'Administrator', MANAGER: 'Manager / Team lead', MEMBER: 'Member' }
