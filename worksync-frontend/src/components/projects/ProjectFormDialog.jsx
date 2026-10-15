import { useState } from 'react'
import { createProject, updateProject } from '../../api/projectsApi'
import { Dialog } from '../ui/Primitives'
import { PROJECT_STATUSES, errorText } from '../../lib/ui'

/** Create (no `project`) or edit an existing project. The backend enforces who may do either. */
export default function ProjectFormDialog({ project, teams, onClose, onSaved }) {
  const editing = Boolean(project)
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    team_id: String(project?.team_id ?? teams[0]?.id ?? ''),
    status: project?.status ?? 'PLANNING',
    start_date: project?.start_date ?? '',
    due_date: project?.due_date ?? '',
    github_repo_url: project?.github_repo_url ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Project name is required.'); return }
    if (!editing && !form.team_id) { setError('Create a team first — projects belong to a team.'); return }
    if (form.start_date && form.due_date && form.due_date < form.start_date) { setError('Due date must be after the start date.'); return }
    setBusy(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    }
    try {
      const saved = editing
        ? await updateProject(project.id, payload)
        : await createProject({ ...payload, team_id: Number(form.team_id), github_repo_url: form.github_repo_url.trim() || undefined })
      onSaved(saved)
    } catch (err) {
      setError(errorText(err, editing ? 'Could not save the project.' : 'Could not create the project.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title={editing ? 'Edit project' : 'New project'} onClose={onClose} width={540}>
      <form onSubmit={save} className="form-grid">
        {error && <div className="alert alert-danger">{error}</div>}
        <label className="field">
          <span className="field-label">Name</span>
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} maxLength={150} required data-autofocus />
        </label>
        <label className="field">
          <span className="field-label">Description</span>
          <textarea className="textarea" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
        </label>
        <div className="form-row-2">
          {!editing && (
            <label className="field">
              <span className="field-label">Team</span>
              <select className="select" value={form.team_id} onChange={e => set('team_id', e.target.value)}>
                {!teams.length && <option value="">No teams available</option>}
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          )}
          <label className="field">
            <span className="field-label">Status</span>
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              {PROJECT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>
        <div className="form-row-2">
          <label className="field">
            <span className="field-label">Start date</span>
            <input className="input" type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">Due date</span>
            <input className="input" type="date" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} />
          </label>
        </div>
        {!editing && (
          <label className="field">
            <span className="field-label">GitHub repository <span className="faint">(optional)</span></span>
            <input className="input" type="url" placeholder="https://github.com/owner/repo" value={form.github_repo_url} onChange={e => set('github_repo_url', e.target.value)} />
            <span className="field-hint">You can also link or change it later from the project&apos;s GitHub tab.</span>
          </label>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create project'}</button>
        </div>
      </form>
    </Dialog>
  )
}
