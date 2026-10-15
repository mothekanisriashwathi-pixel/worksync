import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { deleteProject, getProject } from '../../api/projectsApi'
import { getTeamMembers } from '../../api/teamsApi'
import { listSubmissions } from '../../api/submissionsApi'
import { useAuth } from '../../context/AuthContext'
import { usePageCrumb } from '../../components/common/AppShell'
import { useWorkspaceData, userName } from '../../lib/useWorkspaceData'
import TaskWorkspace from '../../components/tasks/TaskWorkspace'
import GithubPanel from '../../components/projects/GithubPanel'
import ProjectFormDialog from '../../components/projects/ProjectFormDialog'
import { Dialog, EmptyState, ProgressBar, Skeleton, StatusPill } from '../../components/ui/Primitives'
import { IconEdit, IconDelete, IconGitHub, IconTeam, IconInbox, IconCalendar, IconBack } from '../../components/common/WorkSyncIcons'
import {
  TASK_STATUSES, canManageRole, daysUntil, errorText, formatDay, initials, isOverdue, parseDate, progressOf, projectStatusMeta, timeAgo,
} from '../../lib/ui'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'team', label: 'Team' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'github', label: 'GitHub' },
]

const SUBMISSION_BADGES = {
  PENDING: ['Submitted', 'badge-warning'],
  IN_REVIEW: ['In Review', 'badge-inreview'],
  CHANGES_REQUESTED: ['Changes Requested', 'badge-danger'],
  APPROVED: ['Approved', 'badge-success'],
}

export default function ProjectWorkspacePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const canManage = canManageRole(role)
  const [params, setParams] = useSearchParams()
  const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'overview'

  const data = useWorkspaceData()
  const [project, setProject] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setProject(null)
    setLoadError('')
    getProject(projectId)
      .then(setProject)
      .catch(err => setLoadError(
        err?.response?.status === 404 ? 'This project does not exist or was deleted.'
          : err?.response?.status === 403 ? 'You do not have access to this project.'
            : errorText(err, 'Could not load the project.'),
      ))
  }, [projectId])

  usePageCrumb(project?.name)

  const tasks = useMemo(() => data.tasks.filter(t => String(t.project_id) === String(projectId)), [data.tasks, projectId])
  const team = data.teams.find(t => t.id === project?.team_id)

  function setTab(id) {
    setParams(id === 'overview' ? {} : { tab: id }, { replace: true })
  }

  async function remove() {
    setBusy(true)
    try {
      await deleteProject(project.id)
      navigate('/projects', { replace: true })
    } catch (err) {
      setDeleteError(errorText(err, 'Could not delete the project.'))
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  if (loadError) {
    return (
      <div className="panel">
        <EmptyState title={loadError} action={<Link className="btn btn-secondary btn-sm" to="/projects"><IconBack size={14} /> All projects</Link>} />
      </div>
    )
  }
  if (!project) return <div className="panel"><Skeleton rows={6} /></div>

  const meta = projectStatusMeta(project.status)

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title">{project.name}</h1>
            <span className={`badge ${meta.badge}`}>{meta.label}</span>
          </div>
          <p className="page-subtitle" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconTeam size={14} />{team?.name ?? `Team #${project.team_id}`}</span>
            {(project.start_date || project.due_date) && (
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                <IconCalendar size={14} />{project.start_date ? formatDay(project.start_date) : '—'} → {project.due_date ? formatDay(project.due_date) : 'no due date'}
              </span>
            )}
            {project.github_repo_url && <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconGitHub size={14} />Linked</span>}
          </p>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}><IconEdit size={14} /> Edit</button>
            <button className="btn btn-ghost" style={{ color: 'var(--danger-text)' }} onClick={() => setConfirmDelete(true)}><IconDelete size={14} /> Delete</button>
          </div>
        )}
      </div>
      {deleteError && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{deleteError}</div>}

      <div className="tabs" role="tablist" aria-label="Project sections" style={{ marginBottom: 18 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'tasks' && !data.loading && <span className="count">{tasks.length}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' && <Overview project={project} tasks={tasks} data={data} team={team} onTab={setTab} />}
        {tab === 'tasks' && <TaskWorkspace data={data} fixedProjectId={project.id} />}
        {tab === 'team' && <TeamTab project={project} tasks={tasks} />}
        {tab === 'submissions' && <SubmissionsTab projectId={project.id} />}
        {tab === 'github' && <GithubPanel project={project} canManage={canManage} onProjectUpdated={setProject} />}
      </div>

      {editing && (
        <ProjectFormDialog
          project={project}
          teams={data.teams}
          onClose={() => setEditing(false)}
          onSaved={saved => { setProject(saved); setEditing(false) }}
        />
      )}
      {confirmDelete && (
        <Dialog
          title="Delete project?"
          onClose={() => setConfirmDelete(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)} data-autofocus>Cancel</button>
            <button className="btn btn-destructive" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Delete project'}</button>
          </>}
        >
          <p style={{ margin: 0, fontSize: 13.5 }}>
            “{project.name}” and all {tasks.length} of its tasks, submissions and comments will be permanently deleted.
          </p>
        </Dialog>
      )}
    </div>
  )
}

function Overview({ project, tasks, data, team, onTab }) {
  const progress = progressOf(tasks)
  const overdue = tasks.filter(isOverdue)
  const counts = TASK_STATUSES.map(s => ({ ...s, n: tasks.filter(t => t.status === s.id).length }))
  const upcoming = tasks
    .filter(t => t.status !== 'COMPLETED' && t.due_date)
    .sort((a, b) => parseDate(a.due_date) - parseDate(b.due_date))
    .slice(0, 6)
  const workload = [...new Set(tasks.map(t => t.assigned_to))].map(id => ({
    id,
    name: userName(data.users, id),
    open: tasks.filter(t => t.assigned_to === id && t.status !== 'COMPLETED').length,
    done: tasks.filter(t => t.assigned_to === id && t.status === 'COMPLETED').length,
  })).sort((a, b) => b.open - a.open)
  const due = daysUntil(project.due_date)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))', gap: 16, alignItems: 'start' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <section className="panel">
          <div className="panel-head"><h2 className="section-title">Progress</h2>
            <span className="faint" style={{ fontSize: 12.5 }}>{tasks.filter(t => t.status === 'COMPLETED').length} of {tasks.length} tasks completed</span>
          </div>
          <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
            <ProgressBar value={progress} label="Project progress" />
            {tasks.length > 0 && (
              <>
                <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-subtle)' }} aria-hidden="true">
                  {counts.filter(c => c.n).map(c => (
                    <span key={c.id} style={{ width: `${(c.n / tasks.length) * 100}%`, background: `var(--status-${c.id === 'TODO' ? 'todo' : c.id === 'IN_PROGRESS' ? 'inprogress' : c.id === 'IN_REVIEW' ? 'inreview' : 'completed'}-text)`, opacity: c.id === 'TODO' ? 0.45 : 0.9 }} />
                  ))}
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 12.5 }}>
                  {counts.map(c => (
                    <li key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span className="status-dot" data-status={c.id} aria-hidden="true" />{c.label} <strong className="mono">{c.n}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {overdue.length > 0 && <div className="alert alert-danger">{overdue.length} task{overdue.length > 1 ? 's are' : ' is'} overdue.</div>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2 className="section-title">Upcoming deadlines</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => onTab('tasks')}>All tasks</button>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon={IconCalendar}>No open tasks with due dates.</EmptyState>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {upcoming.map(t => (
                <li key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <Link to={`/projects/${project.id}?tab=tasks&task=${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', color: 'inherit' }}>
                    <StatusPill status={t.status} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    <span className={isOverdue(t) ? 'overdue' : 'cell-muted'} style={{ fontSize: 12.5 }}>{formatDay(t.due_date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="panel">
          <div className="panel-head"><h2 className="section-title">Details</h2></div>
          <div className="panel-body">
            {project.description
              ? <p style={{ margin: '0 0 14px', whiteSpace: 'pre-wrap', fontSize: 13.5 }}>{project.description}</p>
              : <p className="faint" style={{ margin: '0 0 14px', fontSize: 13.5 }}>No description.</p>}
            <dl className="meta-grid">
              <dt>Team</dt><dd>{team?.name ?? `Team #${project.team_id}`}</dd>
              <dt>Manager</dt><dd>{userName(data.users, project.manager_id)}</dd>
              <dt>Start</dt><dd>{project.start_date ? formatDay(project.start_date) : '—'}</dd>
              <dt>Due</dt>
              <dd className={due !== null && due < 0 && project.status !== 'COMPLETED' ? 'overdue' : undefined}>
                {project.due_date ? `${formatDay(project.due_date)}${project.status !== 'COMPLETED' && due !== null ? ` · ${due < 0 ? `${-due}d late` : `${due}d left`}` : ''}` : '—'}
              </dd>
              <dt>Repository</dt>
              <dd>{project.github_repo_url
                ? <button className="btn btn-ghost btn-sm" style={{ paddingLeft: 0 }} onClick={() => onTab('github')}><IconGitHub size={14} />{project.github_repo_url.replace('https://github.com/', '')}</button>
                : <span className="faint">Not linked</span>}
              </dd>
            </dl>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2 className="section-title">Workload</h2></div>
          {workload.length === 0 ? <EmptyState icon={IconTeam}>No tasks assigned yet.</EmptyState> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
              {workload.map(w => (
                <li key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', fontSize: 13 }}>
                  <span className="avatar-xs" aria-hidden="true">{initials(w.name)}</span>
                  <span style={{ flex: 1 }}>{w.name}</span>
                  <span className="cell-muted">{w.open} open · {w.done} done</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function TeamTab({ project, tasks }) {
  const [state, setState] = useState({ members: [], loading: true, error: '' })
  useEffect(() => {
    getTeamMembers(project.team_id)
      .then(members => setState({ members, loading: false, error: '' }))
      .catch(err => setState({ members: [], loading: false, error: err?.response?.status === 403 ? 'Only the team lead, team members and admins can see this roster.' : errorText(err, 'Could not load team members.') }))
  }, [project.team_id])

  if (state.loading) return <div className="panel"><Skeleton rows={4} /></div>
  if (state.error) return <div className="panel"><EmptyState icon={IconTeam}>{state.error}</EmptyState></div>
  if (!state.members.length) return <div className="panel"><EmptyState icon={IconTeam} title="No members yet">Add people from the Team page.</EmptyState></div>

  return (
    <div className="panel table-wrap">
      <table className="data-table stack">
        <thead><tr><th>Member</th><th>Role</th><th>Open tasks</th><th>Completed</th></tr></thead>
        <tbody>
          {state.members.map(m => {
            const mine = tasks.filter(t => t.assigned_to === m.user_id)
            return (
              <tr key={m.user_id}>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span className="avatar-xs" aria-hidden="true">{initials(m.user?.name)}</span>
                    <span><span style={{ fontWeight: 550 }}>{m.user?.name}</span> <span className="faint" style={{ fontSize: 12 }}>{m.user?.email}</span></span>
                  </span>
                </td>
                <td className="cell-muted" data-label="Role">{m.user?.role === 'MEMBER' ? 'Member' : m.user?.role === 'MANAGER' ? 'Manager' : m.user?.role}</td>
                <td className="cell-muted" data-label="Open tasks">{mine.filter(t => t.status !== 'COMPLETED').length}</td>
                <td className="cell-muted" data-label="Completed">{mine.filter(t => t.status === 'COMPLETED').length}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SubmissionsTab({ projectId }) {
  const [state, setState] = useState({ items: [], loading: true, error: '' })
  useEffect(() => {
    listSubmissions()
      .then(items => setState({ items: items.filter(s => s.project_id === projectId), loading: false, error: '' }))
      .catch(err => setState({ items: [], loading: false, error: errorText(err, 'Could not load submissions.') }))
  }, [projectId])

  if (state.loading) return <div className="panel"><Skeleton rows={4} /></div>
  if (state.error) return <div className="alert alert-danger">{state.error}</div>
  if (!state.items.length) return <div className="panel"><EmptyState icon={IconInbox} title="No submissions">Work submitted for this project’s tasks will show up here.</EmptyState></div>

  return (
    <div className="panel table-wrap">
      <table className="data-table stack">
        <thead><tr><th>Task</th><th>Revision</th><th>Submitted by</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>
          {state.items.map(s => {
            const [label, badge] = SUBMISSION_BADGES[s.status] ?? [s.status, '']
            return (
              <tr key={s.id}>
                <td><Link to={`/submissions?open=${s.id}`} className="cell-title" style={{ color: 'var(--text-primary)', display: 'block' }}>{s.task_title}</Link></td>
                <td className="mono cell-muted" data-label="Revision">v{s.version}</td>
                <td className="cell-muted" data-label="Submitted by">{s.submitter_name}</td>
                <td data-label="Status"><span className={`badge ${badge}`}>{label}</span></td>
                <td className="cell-muted" data-label="Submitted">{timeAgo(s.submitted_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
