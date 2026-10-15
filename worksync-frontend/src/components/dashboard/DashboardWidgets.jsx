import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SpotlightCard from '../reactbits/SpotlightCard'
import { useTheme } from '../../context/ThemeContext'
import { listSubmissions } from '../../api/submissionsApi'
import { EmptyState, PriorityTag, ProgressBar, Skeleton, StatusPill } from '../ui/Primitives'
import {
  IconTasks, IconProjects, IconTeam, IconCheck, IconWarning, IconProgress, IconInbox, IconCalendar, IconNotifications,
} from '../common/WorkSyncIcons'
import { TASK_STATUSES, daysUntil, formatDay, initials, timeAgo } from '../../lib/ui'

const METRIC_ICONS = { tasks: IconTasks, projects: IconProjects, team: IconTeam, check: IconCheck, warning: IconWarning, progress: IconProgress }
const METRIC_TONES = {
  primary: 'var(--accent-text)', info: 'var(--info-text)', success: 'var(--success-text)', warning: 'var(--warning-text)', danger: 'var(--danger-text)',
}

export function Widget({ title, sub, action, children, id, flush = true }) {
  return (
    <section className="panel" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="panel-head">
        <div style={{ minWidth: 0 }}>
          <h2 className="section-title" id={id ? `${id}-title` : undefined}>{title}</h2>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
        {action}
      </div>
      {flush ? children : <div className="panel-body">{children}</div>}
    </section>
  )
}

/** Metric tiles — React Bits SpotlightCard adds a restrained cursor highlight (static under reduced motion). */
export function MetricRow({ metrics }) {
  const { theme } = useTheme()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12, marginBottom: 16 }}>
      {metrics.map(m => {
        const Icon = METRIC_ICONS[m.icon] || IconProgress
        const tone = METRIC_TONES[m.color] || 'var(--text-secondary)'
        return (
          <SpotlightCard
            key={m.key}
            className="metric-spot"
            theme={theme}
            spotlightColor={theme === 'dark' ? 'rgba(34, 211, 238, 0.55)' : 'rgba(8, 145, 178, 0.45)'}
            intensity={0.12}
            spotlightSize={200}
            proximity={40}
            flare={false}
            style={{
              '--spotlight-card-surface': 'var(--surface-card)',
              '--spotlight-card-border': 'var(--border-color)',
              '--spotlight-card-shadow': 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</span>
              <Icon size={16} style={{ color: tone }} />
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {m.value}
            </div>
          </SpotlightCard>
        )
      })}
    </div>
  )
}

export function StatusDistribution({ distribution }) {
  const rows = [
    { id: 'TODO', n: distribution.todo || 0 },
    { id: 'IN_PROGRESS', n: distribution.in_progress || 0 },
    { id: 'IN_REVIEW', n: distribution.in_review || 0 },
    { id: 'COMPLETED', n: distribution.completed || 0 },
  ]
  const total = rows.reduce((s, r) => s + r.n, 0)
  const color = id => `var(--status-${{ TODO: 'todo', IN_PROGRESS: 'inprogress', IN_REVIEW: 'inreview', COMPLETED: 'completed' }[id]}-text)`
  return (
    <Widget title="Task status" sub={total ? `${total} task${total === 1 ? '' : 's'}` : undefined} flush={false}>
      {total === 0 ? <EmptyState icon={IconTasks}>No tasks yet.</EmptyState> : (
        <>
          <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-subtle)', marginBottom: 14 }} aria-hidden="true">
            {rows.filter(r => r.n).map(r => <span key={r.id} style={{ width: `${(r.n / total) * 100}%`, background: color(r.id), opacity: r.id === 'TODO' ? 0.45 : 0.9 }} />)}
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {rows.map(r => (
              <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <StatusPill status={r.id} />
                <span style={{ flex: 1, borderBottom: '1px dotted var(--border-color)', margin: '0 4px' }} />
                <span className="mono" style={{ fontWeight: 600 }}>{r.n}</span>
                <span className="faint mono" style={{ width: 40, textAlign: 'right' }}>{Math.round((r.n / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Widget>
  )
}

const HEALTH_BADGE = { 'On Track': 'badge-success', 'At Risk': 'badge-warning', Delayed: 'badge-danger', Completed: 'badge-info' }

export function ProjectList({ projects, title = 'Projects', showHealth = true }) {
  return (
    <Widget title={title} sub={projects.length ? `${projects.length} project${projects.length === 1 ? '' : 's'}` : undefined} action={<Link className="btn btn-ghost btn-sm" to="/projects">View all</Link>}>
      {projects.length === 0 ? <EmptyState icon={IconProjects}>No projects in this view yet.</EmptyState> : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {projects.slice(0, 6).map(p => (
            <li key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <Link to={`/projects/${p.id}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(90px, 160px)', gap: 12, alignItems: 'center', padding: '10px 16px', color: 'inherit' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    {showHealth && <span className={`badge ${HEALTH_BADGE[p.health] || ''}`}>{p.health}</span>}
                  </div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
                    {p.team_name || 'Team'} · {p.tasks_done}/{p.tasks_total} done
                    {p.overdue_tasks > 0 && <span className="overdue"> · {p.overdue_tasks} overdue</span>}
                    {p.due_date && ` · due ${formatDay(p.due_date)}`}
                  </div>
                </div>
                <ProgressBar value={p.tasks_total ? p.progress : null} label={`${p.name} progress`} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

export function TaskList({ title, sub, tasks, emptyText, showAssignee = false, action }) {
  return (
    <Widget title={title} sub={sub} action={action ?? <Link className="btn btn-ghost btn-sm" to="/tasks">All tasks</Link>}>
      {tasks.length === 0 ? <EmptyState icon={IconCalendar}>{emptyText}</EmptyState> : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {tasks.slice(0, 7).map(t => {
            const d = daysUntil(t.due_date)
            return (
              <li key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <Link to={`/tasks?task=${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', color: 'inherit' }}>
                  <span className="status-dot" data-status={t.status} title={t.status} aria-hidden="true" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    <span className="faint" style={{ fontSize: 12 }}>{t.project_name}{showAssignee && t.assignee_name ? ` · ${t.assignee_name}` : ''}</span>
                  </span>
                  <PriorityTag priority={t.priority} showLabel={false} />
                  <span className={t.is_overdue ? 'overdue' : 'cell-muted'} style={{ fontSize: 12, width: 74, textAlign: 'right' }}>
                    {t.due_date ? (t.is_overdue ? `${-d}d late` : d === 0 ? 'Today' : formatDay(t.due_date)) : '—'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Widget>
  )
}

export function Workload({ workload }) {
  const max = Math.max(1, ...workload.map(w => w.open_tasks + w.in_review))
  return (
    <Widget title="Team workload" sub="Open and in-review tasks per person">
      {workload.length === 0 ? <EmptyState icon={IconTeam}>No team members with tasks.</EmptyState> : (
        <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
          {workload.map(w => (
            <li key={w.user_id} style={{ display: 'grid', gridTemplateColumns: '26px minmax(0, 140px) 1fr auto', gap: 10, alignItems: 'center', padding: '7px 16px', fontSize: 13 }}>
              <span className="avatar-xs" aria-hidden="true">{initials(w.name)}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
              <span style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-subtle)' }} aria-hidden="true">
                <span style={{ width: `${(w.open_tasks / max) * 100}%`, background: 'var(--accent)' }} />
                <span style={{ width: `${(w.in_review / max) * 100}%`, background: 'var(--violet)' }} />
              </span>
              <span className="cell-muted mono" style={{ fontSize: 12 }}>{w.open_tasks} open · {w.in_review} rev · {w.completed} done</span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

export function ReviewQueue({ reviews, title = 'Review queue' }) {
  return (
    <Widget
      id="pending-reviews"
      title={title}
      sub={reviews.length ? `${reviews.length} awaiting a decision` : 'Nothing waiting'}
      action={<Link className="btn btn-ghost btn-sm" to="/submissions">Open queue</Link>}
    >
      {reviews.length === 0 ? <EmptyState icon={IconCheck} title="Queue clear">No submissions are waiting for review.</EmptyState> : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {reviews.slice(0, 6).map(r => (
            <li key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <Link to={`/submissions?open=${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', color: 'inherit' }}>
                <IconInbox size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.task_title} <span className="faint mono" style={{ fontWeight: 500 }}>v{r.version}</span>
                  </span>
                  <span className="faint" style={{ fontSize: 12 }}>{r.submitter_name}{r.project_name ? ` · ${r.project_name}` : ''} · {timeAgo(r.submitted_at)}</span>
                </span>
                <span className={`badge ${r.status === 'IN_REVIEW' ? 'badge-inreview' : 'badge-warning'}`}>{r.status === 'IN_REVIEW' ? 'In review' : 'Submitted'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}

const SUBMISSION_BADGES = {
  PENDING: ['Submitted', 'badge-warning'],
  IN_REVIEW: ['In review', 'badge-inreview'],
  CHANGES_REQUESTED: ['Changes requested', 'badge-danger'],
  APPROVED: ['Approved', 'badge-success'],
}

/** A member's own submissions (GET /submissions is scoped to the submitter for members). */
export function MySubmissions() {
  const [state, setState] = useState({ items: [], loading: true, error: false })
  useEffect(() => {
    listSubmissions()
      .then(items => setState({ items, loading: false, error: false }))
      .catch(() => setState({ items: [], loading: false, error: true }))
  }, [])
  // Latest revision per task only
  const latest = [...new Map(state.items.map(s => [s.task_id, s])).values()]
  return (
    <Widget title="My submissions" sub="Latest revision per task" action={<Link className="btn btn-ghost btn-sm" to="/submissions">View all</Link>}>
      {state.loading ? <Skeleton rows={3} /> : state.error ? <div className="panel-body"><div className="alert alert-danger">Could not load submissions.</div></div>
        : latest.length === 0 ? <EmptyState icon={IconInbox}>You haven&apos;t submitted any work yet.</EmptyState> : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {latest.slice(0, 6).map(s => {
              const [label, badge] = SUBMISSION_BADGES[s.status] ?? [s.status, '']
              return (
                <li key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <Link to={`/submissions?open=${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', color: 'inherit' }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.task_title}</span>
                      <span className="faint" style={{ fontSize: 12 }}>v{s.version} · {timeAgo(s.submitted_at)}{s.status === 'CHANGES_REQUESTED' && s.reviewer_name ? ` · feedback from ${s.reviewer_name}` : ''}</span>
                    </span>
                    <span className={`badge ${badge}`}>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
    </Widget>
  )
}

export function Activity({ items, title = 'Recent activity' }) {
  return (
    <Widget title={title} sub="From your notifications">
      {items.length === 0 ? <EmptyState icon={IconNotifications}>No activity yet.</EmptyState> : (
        <ol style={{ listStyle: 'none', margin: 0, padding: '6px 0' }}>
          {items.slice(0, 8).map(a => (
            <li key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 16px', fontSize: 13 }}>
              <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 7, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block' }}>{a.target}</span>
                <span className="faint" style={{ fontSize: 12 }}>{a.time}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Widget>
  )
}

export function PlatformOverview({ overview }) {
  if (!overview) return null
  const users = overview.user_distribution || {}
  const health = overview.task_health || {}
  const stat = (label, value) => (
    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--surface-subtle)' }}>
      <div className="faint" style={{ fontSize: 12 }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  )
  return (
    <Widget title="Platform overview" sub="All teams and projects" flush={false} action={<Link className="btn btn-ghost btn-sm" to="/team">Manage teams</Link>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: 8, marginBottom: 14 }}>
        {stat('Users', overview.total_users)}
        {stat('Teams', overview.total_teams)}
        {stat('Projects', overview.total_projects)}
        {stat('Active projects', overview.active_projects)}
      </div>
      <dl className="meta-grid" style={{ gridTemplateColumns: '1fr auto' }}>
        <dt>Admins · Managers · Members</dt><dd className="mono">{users.ADMIN ?? 0} · {users.MANAGER ?? 0} · {users.MEMBER ?? 0}</dd>
        <dt>Overdue tasks</dt><dd className="mono" style={{ color: health.overdue ? 'var(--danger-text)' : undefined }}>{health.overdue ?? 0}</dd>
        {TASK_STATUSES.map(s => {
          const key = { TODO: 'todo', IN_PROGRESS: 'in_progress', IN_REVIEW: 'in_review', COMPLETED: 'completed' }[s.id]
          return [<dt key={`${s.id}-t`}>{s.label}</dt>, <dd key={`${s.id}-d`} className="mono">{health[key] ?? 0}</dd>]
        })}
      </dl>
    </Widget>
  )
}
