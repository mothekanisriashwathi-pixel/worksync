import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useWorkspaceData } from '../../lib/useWorkspaceData'
import ProjectFormDialog from '../../components/projects/ProjectFormDialog'
import { EmptyState, ProgressBar, Skeleton } from '../../components/ui/Primitives'
import { IconAdd, IconSearch, IconProjects, IconGitHub, IconChevronDown, IconChevronUp } from '../../components/common/WorkSyncIcons'
import { PROJECT_STATUSES, canManageRole, daysUntil, formatDay, isOverdue, parseDate, progressOf, projectStatusMeta } from '../../lib/ui'

export default function ProjectsPage() {
  const { role } = useAuth()
  const canManage = canManageRole(role)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const data = useWorkspaceData()
  const { projects, tasks, teams, loading, error } = data

  const q = params.get('q') || ''
  const status = params.get('status') || ''
  const team = params.get('team') || ''
  const sort = params.get('sort') || 'name'
  const dir = params.get('dir') === 'desc' ? 'desc' : 'asc'

  function setParam(updates) {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setParams(next, { replace: true })
  }

  const teamName = id => teams.find(t => t.id === id)?.name ?? `Team #${id}`

  const rows = useMemo(() => {
    const byProject = new Map()
    tasks.forEach(t => byProject.set(t.project_id, [...(byProject.get(t.project_id) || []), t]))
    const query = q.trim().toLowerCase()
    const list = projects
      .map(p => {
        const pt = byProject.get(p.id) || []
        return {
          ...p,
          progress: progressOf(pt),
          open: pt.filter(t => t.status !== 'COMPLETED').length,
          overdue: pt.filter(isOverdue).length,
          total: pt.length,
        }
      })
      .filter(p => (!query || `${p.name} ${p.description || ''}`.toLowerCase().includes(query))
        && (!status || p.status === status)
        && (!team || String(p.team_id) === team))
    const key = {
      name: p => p.name.toLowerCase(),
      due: p => parseDate(p.due_date)?.getTime() ?? Number.MAX_SAFE_INTEGER,
      progress: p => p.progress ?? -1,
      open: p => p.open,
    }[sort] || (p => p.id)
    const d = dir === 'desc' ? -1 : 1
    return list.sort((a, b) => (key(a) > key(b) ? d : key(a) < key(b) ? -d : 0))
  }, [projects, tasks, q, status, team, sort, dir])

  const sortBy = col => setParam({ sort: col, dir: sort === col && dir === 'asc' ? 'desc' : 'asc' })
  const Th = ({ col, children, style }) => (
    <th style={style} aria-sort={sort === col ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => sortBy(col)}>
        {children}{sort === col && (dir === 'asc' ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />)}
      </button>
    </th>
  )

  const active = projects.filter(p => p.status === 'IN_PROGRESS').length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            {loading ? 'Loading projects…' : `${projects.length} project${projects.length === 1 ? '' : 's'} · ${active} in progress`}
          </p>
        </div>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setParam({ new: '1' })}>
            <IconAdd size={15} /> New project
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="input-icon grow">
          <IconSearch size={15} />
          <input className="input" type="search" placeholder="Search projects" value={q} onChange={e => setParam({ q: e.target.value })} aria-label="Search projects" />
        </div>
        <div className="segmented" role="group" aria-label="Filter by status" style={{ flexWrap: 'wrap' }}>
          <button type="button" aria-pressed={!status} onClick={() => setParam({ status: '' })}>All</button>
          {PROJECT_STATUSES.map(s => (
            <button key={s.id} type="button" aria-pressed={status === s.id} onClick={() => setParam({ status: s.id })}>{s.label}</button>
          ))}
        </div>
        {teams.length > 1 && (
          <select className="select" style={{ width: 'auto' }} value={team} onChange={e => setParam({ team: e.target.value })} aria-label="Filter by team">
            <option value="">All teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="panel table-wrap">
        {loading ? <Skeleton rows={6} /> : projects.length === 0 ? (
          <EmptyState
            icon={IconProjects}
            title="No projects yet"
            action={canManage && <button className="btn btn-primary btn-sm" onClick={() => setParam({ new: '1' })}><IconAdd size={14} /> New project</button>}
          >
            {canManage ? 'Create a project for one of your teams to start planning work.' : 'Projects from your teams will appear here once a lead creates them.'}
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState icon={IconSearch} title="No matching projects" action={<button className="btn btn-secondary btn-sm" onClick={() => setParam({ q: '', status: '', team: '' })}>Clear filters</button>} />
        ) : (
          <table className="data-table stack">
            <thead>
              <tr>
                <Th col="name">Project</Th>
                <th>Status</th>
                <th>Team</th>
                <Th col="progress" style={{ minWidth: 150 }}>Progress</Th>
                <Th col="open">Open</Th>
                <Th col="due">Due</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => {
                const meta = projectStatusMeta(p.status)
                const days = daysUntil(p.due_date)
                const late = p.status !== 'COMPLETED' && days !== null && days < 0
                return (
                  <tr key={p.id} className="row-link" onClick={() => navigate(`/projects/${p.id}`)}>
                    <td style={{ paddingTop: 8, paddingBottom: 8, height: 'auto' }}>
                      <a
                        href={`/projects/${p.id}`}
                        onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/projects/${p.id}`) }}
                        className="cell-title"
                        style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {p.name}
                        {p.github_repo_url && <IconGitHub size={13} aria-label="GitHub linked" style={{ color: 'var(--text-tertiary)' }} />}
                      </a>
                      {p.description && <div className="faint" style={{ fontSize: 12, maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    </td>
                    <td data-label="Status"><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                    <td className="cell-muted" data-label="Team">{teamName(p.team_id)}</td>
                    <td data-label="Progress"><ProgressBar value={p.progress} label={`${p.name} progress`} /></td>
                    <td className="cell-muted" data-label="Open tasks">
                      {p.open}
                      {p.overdue > 0 && <span className="overdue" style={{ marginLeft: 6, fontSize: 12 }}>{p.overdue} overdue</span>}
                    </td>
                    <td data-label="Due" className={late ? 'overdue' : 'cell-muted'}>{p.due_date ? formatDay(p.due_date) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {params.get('new') === '1' && canManage && (
        <ProjectFormDialog
          teams={teams}
          onClose={() => setParam({ new: '' })}
          onSaved={created => { setParam({ new: '' }); navigate(`/projects/${created.id}`) }}
        />
      )}
    </div>
  )
}
