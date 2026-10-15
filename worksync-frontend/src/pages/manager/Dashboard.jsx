import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getDashboardSummary } from '../../api/dashboardApi'
import { submitTaskWork, buildSubmissionForm } from '../../api/submissionsApi'
import { SubmissionFields } from '../submissions/SubmissionsPage'
import { Dialog, EmptyState, Skeleton } from '../../components/ui/Primitives'
import {
  Activity, MetricRow, MySubmissions, PlatformOverview, ProjectList, ReviewQueue, StatusDistribution, TaskList, Workload,
} from '../../components/dashboard/DashboardWidgets'
import { IconAdd, IconInbox, IconWarning, IconTasks, IconTeam, IconProjects } from '../../components/common/WorkSyncIcons'
import { errorText } from '../../lib/ui'

const VIEW_LABELS = { member: 'My work', team_lead: 'Team lead', manager: 'Portfolio', admin: 'Admin' }

const grid = (min = 340) => ({
  display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`, gap: 16, alignItems: 'start', marginBottom: 16,
})

export default function Dashboard() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const requestedView = params.get('view')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getDashboardSummary(requestedView)
      .then(setData)
      .catch(err => setError(errorText(err, 'Unable to load the dashboard.')))
      .finally(() => setLoading(false))
  }, [requestedView])

  useEffect(() => { load() }, [load])

  if (loading && !data) {
    return (
      <div>
        <div className="skeleton" style={{ height: 30, width: 280, marginBottom: 20 }} />
        <div style={grid(200)}>{[0, 1, 2, 3].map(i => <div key={i} className="panel" style={{ height: 92 }}><Skeleton rows={2} /></div>)}</div>
        <div style={grid()}><div className="panel"><Skeleton rows={6} /></div><div className="panel"><Skeleton rows={6} /></div></div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="panel">
        <EmptyState icon={IconWarning} title="Dashboard unavailable" action={<button className="btn btn-secondary btn-sm" onClick={load}>Try again</button>}>
          {error}
        </EmptyState>
      </div>
    )
  }

  const view = data.active_view
  const firstName = data.user_name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${firstName}`
  const submittable = (data.tasks || []).filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS')

  const primary = {
    member: <button className="btn btn-primary" onClick={() => setSubmitOpen(true)} disabled={!submittable.length} title={submittable.length ? undefined : 'No open tasks to submit'}><IconInbox size={15} /> Submit work</button>,
    team_lead: <button className="btn btn-primary" onClick={() => navigate('/tasks?new=1')}><IconAdd size={15} /> New task</button>,
    manager: <button className="btn btn-primary" onClick={() => navigate('/projects?new=1')}><IconAdd size={15} /> New project</button>,
    admin: <button className="btn btn-primary" onClick={() => navigate('/team')}><IconTeam size={15} /> Manage teams</button>,
  }[view]

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{greeting}</h1>
          <p className="page-subtitle">{data.date_display} · {data.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {data.allowed_views.length > 1 && (
            <div className="segmented" role="group" aria-label="Dashboard view">
              {data.allowed_views.map(v => (
                <button key={v} type="button" aria-pressed={v === view} onClick={() => setParams(v === data.allowed_views[0] ? {} : { view: v }, { replace: true })}>
                  {VIEW_LABELS[v] ?? v}
                </button>
              ))}
            </div>
          )}
          {primary}
        </div>
      </div>

      {notice && (
        <div className="alert alert-success" style={{ marginBottom: 16, alignItems: 'center' }} role="status">
          <span style={{ flex: 1 }}>{notice}</span>
          <Link to="/submissions" className="btn btn-ghost btn-sm">View submissions</Link>
        </div>
      )}
      {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity var(--dur-base) ease' }} aria-busy={loading}>
        <MetricRow metrics={data.metrics} />

        {view === 'member' && (
          <>
            <div style={grid()}>
              <TaskList
                title="My open work"
                sub="Assigned to you, by due date"
                tasks={(data.tasks || [])
                  .filter(t => t.status !== 'COMPLETED')
                  .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))}
                emptyText="Nothing assigned to you right now."
              />
              <MySubmissions />
            </div>
            <div style={grid()}>
              <ProjectList projects={data.projects} title="My projects" />
              <StatusDistribution distribution={data.task_status_distribution} />
            </div>
            <Activity items={data.recent_activity} />
          </>
        )}

        {view === 'team_lead' && (
          <>
            <div style={grid()}>
              <ReviewQueue reviews={data.pending_reviews} />
              <Workload workload={data.team_workload} />
            </div>
            <div style={grid()}>
              <TaskList title="Upcoming deadlines" sub="Open team tasks with due dates" tasks={data.upcoming_deadlines} showAssignee emptyText="No upcoming deadlines." />
              <ProjectList projects={data.projects} title="Team projects" />
            </div>
            <div style={grid()}>
              <StatusDistribution distribution={data.task_status_distribution} />
              <Activity items={data.recent_activity} title="Team activity" />
            </div>
          </>
        )}

        {view === 'manager' && (
          <>
            <div style={grid()}>
              <ProjectList projects={data.projects} title="Portfolio" />
              <ReviewQueue reviews={data.pending_reviews} title="Pending approvals" />
            </div>
            <div style={grid()}>
              <StatusDistribution distribution={data.task_status_distribution} />
              <Workload workload={data.team_workload} />
            </div>
            <div style={grid()}>
              <TaskList title="Upcoming deadlines" sub="Across managed projects" tasks={data.upcoming_deadlines} showAssignee emptyText="No upcoming deadlines." />
              <Activity items={data.recent_activity} />
            </div>
          </>
        )}

        {view === 'admin' && (
          <>
            <div style={grid()}>
              <PlatformOverview overview={data.platform_overview} />
              <StatusDistribution distribution={data.task_status_distribution} />
            </div>
            <div style={grid()}>
              <TaskList title="Needs attention" sub="Overdue, in review, or high priority" tasks={data.tasks} showAssignee emptyText="Nothing needs attention." />
              <ReviewQueue reviews={data.pending_reviews} title="Reviews (system-wide)" />
            </div>
            <div style={grid()}>
              <ProjectList projects={data.projects} title="All projects" />
              <Activity items={data.recent_activity} title="Latest system notifications" />
            </div>
          </>
        )}

        {!data.projects.length && view !== 'admin' && (
          <div className="panel" style={{ marginTop: 4 }}>
            <EmptyState icon={view === 'member' ? IconTasks : IconProjects} title="Your workspace is empty">
              {view === 'member'
                ? 'Once a lead adds you to a team and assigns tasks, your work shows up here.'
                : 'Create a team and a project to start planning work.'}
            </EmptyState>
          </div>
        )}
      </div>

      {submitOpen && (
        <SubmitWorkDialog
          tasks={submittable}
          onClose={() => setSubmitOpen(false)}
          onSubmitted={created => {
            setSubmitOpen(false)
            setNotice(`Submitted “${created.task_title}” (revision ${created.version}) for review.`)
            load()
          }}
        />
      )}
    </div>
  )
}

function SubmitWorkDialog({ tasks, onClose, onSubmitted }) {
  const [taskId, setTaskId] = useState(String(tasks[0]?.id ?? ''))
  const [comment, setComment] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!taskId) { setError('Choose a task.'); return }
    if (!comment.trim() && !githubUrl.trim() && !file) { setError('Add notes, a GitHub link, or a file.'); return }
    setBusy(true)
    setError('')
    try {
      onSubmitted(await submitTaskWork(taskId, buildSubmissionForm({ comment, githubUrl, file })))
    } catch (err) {
      setError(errorText(err, 'Failed to submit work.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title="Submit work for review" onClose={onClose} width={520}>
      <form onSubmit={submit} className="form-grid">
        {error && <div className="alert alert-danger">{error}</div>}
        <label className="field">
          <span className="field-label">Task</span>
          <select className="select" value={taskId} onChange={e => setTaskId(e.target.value)} data-autofocus>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title} — {t.project_name}</option>)}
          </select>
        </label>
        <SubmissionFields comment={comment} setComment={setComment} githubUrl={githubUrl} setGithubUrl={setGithubUrl} setFile={setFile} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
        </div>
      </form>
    </Dialog>
  )
}
