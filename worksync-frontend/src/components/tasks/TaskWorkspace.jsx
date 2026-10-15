import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createTask, deleteTask, updateTask } from '../../api/tasksApi'
import { getTeamMembers } from '../../api/teamsApi'
import { getTaskSubmissions, submitTaskWork, buildSubmissionForm } from '../../api/submissionsApi'
import { useAuth } from '../../context/AuthContext'
import { SubmissionFields } from '../../pages/submissions/SubmissionsPage'
import { userName } from '../../lib/useWorkspaceData'
import {
  PRIORITIES, TASK_STATUSES, canManageRole, daysUntil, errorText, formatDay, initials, isOverdue, parseDate, priorityMeta, statusLabel, timeAgo,
} from '../../lib/ui'
import { Dialog, Drawer, EmptyState, PriorityTag, Skeleton, StatusPill } from '../ui/Primitives'
import {
  IconAdd, IconSearch, IconList, IconColumns, IconChevronDown, IconChevronUp, IconClose, IconTasks, IconEdit, IconDelete, IconInbox,
} from '../common/WorkSyncIcons'

const MEMBER_STATUSES = ['TODO', 'IN_PROGRESS']
const STATUS_ORDER = Object.fromEntries(TASK_STATUSES.map((s, i) => [s.id, i]))
const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
const DUE_FILTERS = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'week', label: 'Due in 7 days' },
  { id: 'none', label: 'No due date' },
]
const SUBMISSION_LABELS = { PENDING: 'Submitted', IN_REVIEW: 'In Review', CHANGES_REQUESTED: 'Changes Requested', APPROVED: 'Approved' }

/**
 * Task list/board with URL-backed filters and a detail drawer.
 * `fixedProjectId` scopes it to one project (project workspace tab).
 */
export default function TaskWorkspace({ data, fixedProjectId = null, allowCreate = true }) {
  const { role, user } = useAuth()
  const canManage = canManageRole(role)
  const [params, setParams] = useSearchParams()
  const { projects, tasks, users, loading, error, setTasks } = data

  const f = {
    q: params.get('q') || '',
    project: fixedProjectId ? String(fixedProjectId) : params.get('project') || '',
    status: params.get('status') || '',
    priority: params.get('priority') || '',
    assignee: params.get('assignee') || '',
    due: params.get('due') || '',
    view: params.get('view') === 'board' ? 'board' : 'list',
    sort: params.get('sort') || 'due',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
  }
  const openTaskId = params.get('task')
  const creating = params.get('new') === '1' && canManage && allowCreate

  function setParam(updates) {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  // Search box: local state, URL updated after a short pause.
  const [qInput, setQInput] = useState(f.q)
  useEffect(() => { setQInput(f.q) }, [f.q])
  useEffect(() => {
    if (qInput === f.q) return undefined
    const t = setTimeout(() => setParam({ q: qInput }), 200)
    return () => clearTimeout(t)
  }) // runs each render; the timer is reset while typing

  const projectName = id => projects.find(p => p.id === id)?.name ?? `Project #${id}`
  const scoped = fixedProjectId ? tasks.filter(t => t.project_id === Number(fixedProjectId)) : tasks

  const assigneeOptions = useMemo(
    () => [...new Set(scoped.map(t => t.assigned_to))].map(id => ({ id, name: userName(users, id) })).sort((a, b) => a.name.localeCompare(b.name)),
    [scoped, users],
  )

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    const rows = scoped.filter(t => {
      if (q && !`${t.title} ${t.description || ''}`.toLowerCase().includes(q)) return false
      if (f.project && String(t.project_id) !== f.project) return false
      if (f.status && t.status !== f.status) return false
      if (f.priority && t.priority !== f.priority) return false
      if (f.assignee && String(t.assigned_to) !== f.assignee) return false
      if (f.due === 'overdue' && !isOverdue(t)) return false
      if (f.due === 'week') { const d = daysUntil(t.due_date); if (d === null || d < 0 || d > 7 || t.status === 'COMPLETED') return false }
      if (f.due === 'none' && t.due_date) return false
      return true
    })
    const key = {
      title: t => t.title.toLowerCase(),
      status: t => STATUS_ORDER[t.status],
      priority: t => PRIORITY_ORDER[t.priority],
      project: t => projectName(t.project_id).toLowerCase(),
      assignee: t => userName(users, t.assigned_to).toLowerCase(),
      due: t => parseDate(t.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER,
    }[f.sort] || (t => t.id)
    const dir = f.dir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => (key(a) > key(b) ? dir : key(a) < key(b) ? -dir : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, f.q, f.project, f.status, f.priority, f.assignee, f.due, f.sort, f.dir, users, projects])

  const chips = [
    f.q.trim() && { key: 'q', label: `“${f.q.trim()}”` },
    !fixedProjectId && f.project && { key: 'project', label: projectName(Number(f.project)) },
    f.status && { key: 'status', label: statusLabel(f.status) },
    f.priority && { key: 'priority', label: priorityMeta(f.priority).label },
    f.assignee && { key: 'assignee', label: userName(users, Number(f.assignee)) },
    f.due && { key: 'due', label: DUE_FILTERS.find(d => d.id === f.due)?.label },
  ].filter(Boolean)

  function sortBy(col) {
    setParam({ sort: col, dir: f.sort === col && f.dir === 'asc' ? 'desc' : 'asc' })
  }

  async function changeStatus(task, status) {
    const previous = task.status
    setTasks(ts => ts.map(t => (t.id === task.id ? { ...t, status } : t))) // optimistic
    try {
      const updated = await updateTask(task.id, { status })
      setTasks(ts => ts.map(t => (t.id === task.id ? updated : t)))
      return null
    } catch (err) {
      setTasks(ts => ts.map(t => (t.id === task.id ? { ...t, status: previous } : t)))
      return errorText(err, 'Could not update status.')
    }
  }

  const openTask = tasks.find(t => String(t.id) === openTaskId)

  return (
    <div>
      <div className="toolbar">
        <div className="input-icon grow">
          <IconSearch size={15} />
          <input
            className="input"
            type="search"
            placeholder="Search titles and descriptions"
            value={qInput}
            onChange={e => setQInput(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
        {!fixedProjectId && (
          <select className="select" style={{ width: 'auto', maxWidth: 200 }} value={f.project} onChange={e => setParam({ project: e.target.value })} aria-label="Filter by project">
            <option value="">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <select className="select" style={{ width: 'auto' }} value={f.status} onChange={e => setParam({ status: e.target.value })} aria-label="Filter by status">
          <option value="">Any status</option>
          {TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={f.priority} onChange={e => setParam({ priority: e.target.value })} aria-label="Filter by priority">
          <option value="">Any priority</option>
          {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {assigneeOptions.length > 1 && (
          <select className="select" style={{ width: 'auto', maxWidth: 180 }} value={f.assignee} onChange={e => setParam({ assignee: e.target.value })} aria-label="Filter by assignee">
            <option value="">Anyone</option>
            {assigneeOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <select className="select" style={{ width: 'auto' }} value={f.due} onChange={e => setParam({ due: e.target.value })} aria-label="Filter by due date">
          <option value="">Any due date</option>
          {DUE_FILTERS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <div className="segmented" role="group" aria-label="Layout">
          <button type="button" aria-pressed={f.view === 'list'} onClick={() => setParam({ view: '' })}><IconList size={14} /> List</button>
          <button type="button" aria-pressed={f.view === 'board'} onClick={() => setParam({ view: 'board' })}><IconColumns size={14} /> Board</button>
        </div>
        {canManage && allowCreate && (
          <button type="button" className="btn btn-primary" onClick={() => setParam({ new: '1' })}>
            <IconAdd size={15} /> New task
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }} aria-label="Active filters">
          {chips.map(c => (
            <span className="chip" key={c.key}>
              {c.label}
              <button type="button" onClick={() => setParam({ [c.key]: '' })} aria-label={`Remove filter ${c.label}`}><IconClose size={11} /></button>
            </span>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setParam({ q: '', project: '', status: '', priority: '', assignee: '', due: '' })}>
            Clear filters
          </button>
          <span className="faint" style={{ fontSize: 12.5 }}>{filtered.length} of {scoped.length}</span>
        </div>
      )}

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div className="panel"><Skeleton rows={7} /></div>
      ) : scoped.length === 0 ? (
        <div className="panel">
          <EmptyState icon={IconTasks} title="No tasks yet">
            {canManage ? 'Create the first task and assign it to a team member.' : 'Tasks assigned to you will appear here.'}
          </EmptyState>
        </div>
      ) : f.view === 'board' ? (
        <TaskBoard tasks={filtered} canManage={canManage} users={users} projectName={projectName} onOpen={id => setParam({ task: String(id) })} onStatus={changeStatus} />
      ) : (
        <div className="panel table-wrap">
          {filtered.length === 0 ? (
            <EmptyState icon={IconSearch} title="No matching tasks" action={<button className="btn btn-secondary btn-sm" onClick={() => setParam({ q: '', project: '', status: '', priority: '', assignee: '', due: '' })}>Clear filters</button>} />
          ) : (
            <table className="data-table stack">
              <thead>
                <tr>
                  <SortTh col="status" f={f} onSort={sortBy}>Status</SortTh>
                  <SortTh col="title" f={f} onSort={sortBy}>Task</SortTh>
                  {!fixedProjectId && <SortTh col="project" f={f} onSort={sortBy}>Project</SortTh>}
                  <SortTh col="assignee" f={f} onSort={sortBy}>Assignee</SortTh>
                  <SortTh col="priority" f={f} onSort={sortBy}>Priority</SortTh>
                  <SortTh col="due" f={f} onSort={sortBy}>Due</SortTh>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr
                    key={t.id}
                    className="row-link"
                    aria-selected={String(t.id) === openTaskId}
                    onClick={() => setParam({ task: String(t.id) })}
                  >
                    <td data-label="Status"><StatusPill status={t.status} /></td>
                    <td>
                      <button
                        type="button"
                        className="cell-title"
                        style={{ color: 'inherit', textAlign: 'left', display: 'block' }}
                        onClick={e => { e.stopPropagation(); setParam({ task: String(t.id) }) }}
                      >
                        {t.title}
                      </button>
                    </td>
                    {!fixedProjectId && <td className="cell-muted" data-label="Project">{projectName(t.project_id)}</td>}
                    <td data-label="Assignee">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span className="avatar-xs" aria-hidden="true">{initials(userName(users, t.assigned_to))}</span>
                        {t.assigned_to === user?.id ? 'You' : userName(users, t.assigned_to)}
                      </span>
                    </td>
                    <td data-label="Priority"><PriorityTag priority={t.priority} /></td>
                    <td data-label="Due"><DueText task={t} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {openTask && (
        <TaskDrawer
          key={openTask.id}
          task={openTask}
          projectName={projectName(openTask.project_id)}
          projects={projects}
          users={users}
          onClose={() => setParam({ task: '' })}
          onStatus={changeStatus}
          onUpdated={updated => setTasks(ts => ts.map(t => (t.id === updated.id ? updated : t)))}
          onDeleted={id => { setTasks(ts => ts.filter(t => t.id !== id)); setParam({ task: '' }) }}
        />
      )}

      {creating && (
        <TaskFormDialog
          projects={projects}
          defaultProjectId={fixedProjectId || f.project}
          onClose={() => setParam({ new: '' })}
          onSaved={created => { setTasks(ts => [created, ...ts]); setParam({ new: '', task: String(created.id) }) }}
        />
      )}
    </div>
  )
}

function SortTh({ col, f, onSort, children }) {
  const active = f.sort === col
  return (
    <th aria-sort={active ? (f.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(col)}>
        {children}
        {active && (f.dir === 'asc' ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />)}
      </button>
    </th>
  )
}

function DueText({ task }) {
  if (!task.due_date) return <span className="faint">—</span>
  const overdue = isOverdue(task)
  const d = daysUntil(task.due_date)
  const soon = !overdue && task.status !== 'COMPLETED' && d !== null && d <= 2
  return (
    <span className={overdue ? 'overdue' : soon ? '' : 'cell-muted'} style={soon ? { color: 'var(--warning-text)', fontWeight: 600 } : undefined}>
      {formatDay(task.due_date)}
      {overdue && <span className="sr-only"> (overdue)</span>}
      {overdue && <span aria-hidden="true" style={{ marginLeft: 4, fontSize: 11 }}>overdue</span>}
    </span>
  )
}

function TaskBoard({ tasks, canManage, users, projectName, onOpen, onStatus }) {
  const [err, setErr] = useState('')
  return (
    <>
      {err && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 12, alignItems: 'start' }}>
        {TASK_STATUSES.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id)
          return (
            <section key={col.id} className="panel" style={{ background: 'var(--surface-subtle)' }} aria-label={`${col.label} column`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                <span className="status-dot" data-status={col.id} aria-hidden="true" />
                <h3 className="section-title" style={{ fontSize: 13 }}>{col.label}</h3>
                <span className="faint mono" style={{ marginLeft: 'auto', fontSize: 12 }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 8px 10px', minHeight: 80 }}>
                {colTasks.length === 0 && <div className="faint" style={{ fontSize: 12.5, textAlign: 'center', padding: '14px 0' }}>Nothing here</div>}
                {colTasks.map(t => (
                  <article key={t.id} className="panel panel-interactive" style={{ padding: 10 }}>
                    <button type="button" onClick={() => onOpen(t.id)} style={{ textAlign: 'left', color: 'inherit', width: '100%' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{t.title}</div>
                      <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>{projectName(t.project_id)}</div>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <PriorityTag priority={t.priority} showLabel={false} />
                      <DueText task={t} />
                      <span className="avatar-xs" style={{ marginLeft: 'auto' }} title={userName(users, t.assigned_to)}>{initials(userName(users, t.assigned_to))}</span>
                    </div>
                    <select
                      className="select select-sm"
                      style={{ marginTop: 8 }}
                      value={t.status}
                      aria-label={`Move “${t.title}”`}
                      onChange={async e => setErr((await onStatus(t, e.target.value)) || '')}
                    >
                      {TASK_STATUSES.map(s => (
                        <option key={s.id} value={s.id} disabled={!canManage && !MEMBER_STATUSES.includes(s.id)}>{s.label}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}

function TaskDrawer({ task, projectName, projects, users, onClose, onStatus, onUpdated, onDeleted }) {
  const { role, user } = useAuth()
  const canManage = canManageRole(role)
  const isAssignee = task.assigned_to === user?.id
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [subs, setSubs] = useState({ items: [], loading: true })

  const loadSubs = () => getTaskSubmissions(task.id)
    .then(items => setSubs({ items, loading: false }))
    .catch(() => setSubs({ items: [], loading: false }))
  useEffect(() => { loadSubs() }, [task.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const latest = subs.items[0]
  const canSubmit = isAssignee && role === 'MEMBER' && task.status !== 'COMPLETED'
    && (!latest || latest.status === 'CHANGES_REQUESTED')

  async function remove() {
    setBusy(true)
    try {
      await deleteTask(task.id)
      onDeleted(task.id)
    } catch (err) {
      setError(errorText(err, 'Could not delete task.'))
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  const statusEditable = canManage || isAssignee

  return (
    <Drawer
      title={task.title}
      onClose={onClose}
      actions={
        <>
          <span className="mono faint" style={{ fontSize: 12 }}>TASK-{task.id}</span>
          {canManage && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><IconEdit size={14} /> Edit</button>}
          {canManage && <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)} style={{ color: 'var(--danger-text)' }}><IconDelete size={14} /> Delete</button>}
        </>
      }
    >
      <h2 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 16px', lineHeight: 1.3 }}>{task.title}</h2>
      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      <dl className="meta-grid">
        <dt>Status</dt>
        <dd>
          {statusEditable ? (
            <select
              className="select select-sm"
              style={{ maxWidth: 200 }}
              value={task.status}
              onChange={async e => setError((await onStatus(task, e.target.value)) || '')}
              aria-label="Task status"
            >
              {TASK_STATUSES.map(s => (
                <option key={s.id} value={s.id} disabled={!canManage && !MEMBER_STATUSES.includes(s.id)}>{s.label}</option>
              ))}
            </select>
          ) : <StatusPill status={task.status} />}
        </dd>
        <dt>Priority</dt><dd><PriorityTag priority={task.priority} /></dd>
        <dt>Assignee</dt>
        <dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="avatar-xs" aria-hidden="true">{initials(userName(users, task.assigned_to))}</span>
          {isAssignee ? `${userName(users, task.assigned_to)} (you)` : userName(users, task.assigned_to)}
        </dd>
        <dt>Project</dt><dd><Link to={`/projects/${task.project_id}`}>{projectName}</Link></dd>
        <dt>Due</dt><dd><DueText task={task} /></dd>
      </dl>

      {!canManage && statusEditable && (
        <p className="faint" style={{ fontSize: 12, marginTop: 10 }}>
          In Review and Completed are set by the review workflow — submit your work to move this task forward.
        </p>
      )}

      <h3 className="section-title" style={{ margin: '22px 0 8px' }}>Description</h3>
      <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13.5, color: task.description ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
        {task.description || 'No description.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 8px' }}>
        <h3 className="section-title">Submissions</h3>
        {canSubmit && <button className="btn btn-primary btn-sm" onClick={() => setSubmitting(true)}>{latest ? 'Submit revision' : 'Submit work'}</button>}
      </div>
      {subs.loading ? <Skeleton rows={2} height={14} /> : subs.items.length === 0 ? (
        <p className="faint" style={{ fontSize: 13, margin: 0 }}>No submissions yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {subs.items.map(s => (
            <li key={s.id}>
              <Link to={`/submissions?open=${s.id}`} className="panel panel-interactive" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', color: 'inherit' }}>
                <IconInbox size={14} />
                <span style={{ fontWeight: 600, fontSize: 13 }}>Revision {s.version}</span>
                <span className="faint" style={{ fontSize: 12 }}>{timeAgo(s.submitted_at)}</span>
                <span className="badge" style={{ marginLeft: 'auto' }}>{SUBMISSION_LABELS[s.status] ?? s.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <TaskFormDialog
          task={task}
          projects={projects}
          onClose={() => setEditing(false)}
          onSaved={updated => { onUpdated(updated); setEditing(false) }}
        />
      )}

      {confirmDelete && (
        <Dialog
          title="Delete task?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)} data-autofocus>Cancel</button>
              <button className="btn btn-destructive" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete task'}</button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 13.5 }}>
            “{task.title}” and its submissions and comments will be permanently deleted.
          </p>
        </Dialog>
      )}

      {submitting && (
        <SubmitWorkDialog
          task={task}
          onClose={() => setSubmitting(false)}
          onSubmitted={() => { setSubmitting(false); onUpdated({ ...task, status: 'IN_REVIEW' }); loadSubs() }}
        />
      )}
    </Drawer>
  )
}

function SubmitWorkDialog({ task, onClose, onSubmitted }) {
  const [comment, setComment] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!comment.trim() && !githubUrl.trim() && !file) {
      setError('Add notes, a GitHub link, or a file.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await submitTaskWork(task.id, buildSubmissionForm({ comment, githubUrl, file }))
      onSubmitted()
    } catch (err) {
      setError(errorText(err, 'Failed to submit work.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={`Submit work — ${task.title}`} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        {error && <div className="alert alert-danger">{error}</div>}
        <SubmissionFields comment={comment} setComment={setComment} githubUrl={githubUrl} setGithubUrl={setGithubUrl} setFile={setFile} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
        </div>
      </form>
    </Dialog>
  )
}

/** Create (no `task`) or edit (with `task`) — managers/admins only; the backend re-checks. */
export function TaskFormDialog({ task, projects, defaultProjectId, onClose, onSaved }) {
  const editing = Boolean(task)
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    project_id: String(task?.project_id ?? defaultProjectId ?? projects[0]?.id ?? ''),
    assigned_to: task ? String(task.assigned_to) : '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'TODO',
    due_date: task?.due_date ?? '',
  })
  const [members, setMembers] = useState({ list: [], loading: true, error: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const project = projects.find(p => String(p.id) === form.project_id)

  useEffect(() => {
    if (!project) { setMembers({ list: [], loading: false, error: '' }); return }
    setMembers(m => ({ ...m, loading: true }))
    getTeamMembers(project.team_id)
      .then(list => {
        const assignable = (list || []).filter(m => (m.user?.role ?? 'MEMBER') === 'MEMBER')
        setMembers({ list: assignable, loading: false, error: '' })
        setForm(f => (assignable.some(m => String(m.user_id) === f.assigned_to) ? f : { ...f, assigned_to: assignable[0] ? String(assignable[0].user_id) : '' }))
      })
      .catch(err => setMembers({ list: [], loading: false, error: errorText(err, 'Could not load the team roster.') }))
  }, [project?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.assigned_to) { setError('Choose an assignee from the project team.'); return }
    setBusy(true)
    setError('')
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assigned_to: Number(form.assigned_to),
      priority: form.priority,
      due_date: form.due_date || null,
    }
    try {
      const saved = editing
        ? await updateTask(task.id, payload)
        : await createTask({ ...payload, project_id: Number(form.project_id), status: form.status })
      onSaved(saved)
    } catch (err) {
      setError(errorText(err, editing ? 'Could not save changes.' : 'Could not create task.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={editing ? 'Edit task' : 'New task'} onClose={onClose} width={520}>
      <form onSubmit={save} className="form-grid">
        {error && <div className="alert alert-danger">{error}</div>}
        <label className="field">
          <span className="field-label">Title</span>
          <input className="input" value={form.title} onChange={e => set('title', e.target.value)} maxLength={200} required data-autofocus />
        </label>
        <label className="field">
          <span className="field-label">Description</span>
          <textarea className="textarea" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
        </label>
        <div className="form-row-2">
          <label className="field">
            <span className="field-label">Project</span>
            <select className="select" value={form.project_id} onChange={e => set('project_id', e.target.value)} disabled={editing}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Assignee</span>
            <select className="select" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} disabled={members.loading || !members.list.length}>
              {members.loading && <option>Loading…</option>}
              {!members.loading && !members.list.length && <option value="">No members in team</option>}
              {members.list.map(m => <option key={m.user_id} value={m.user_id}>{m.user?.name ?? `User #${m.user_id}`}</option>)}
            </select>
          </label>
        </div>
        {members.error && <div className="field-hint" style={{ color: 'var(--danger-text)' }}>{members.error}</div>}
        <div className="form-row-2">
          <label className="field">
            <span className="field-label">Priority</span>
            <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Due date</span>
            <input className="input" type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
          </label>
          {!editing && (
            <label className="field">
              <span className="field-label">Initial status</span>
              <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
                {TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !projects.length}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
