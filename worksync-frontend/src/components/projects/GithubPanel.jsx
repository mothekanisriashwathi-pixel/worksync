import { useCallback, useEffect, useState } from 'react'
import {
  getProjectGithubRepo, getProjectGithubCommits, linkProjectGithub, unlinkProjectGithub,
} from '../../api/projectsApi'
import { Dialog, EmptyState, Skeleton } from '../ui/Primitives'
import { IconGitHub, IconGitBranch, IconGitCommit, IconGitFork, IconStar, IconExternalLink } from '../common/WorkSyncIcons'
import { errorText, timeAgo } from '../../lib/ui'

/** Live repository metadata and recent commits via the backend's GitHub proxy (never calls GitHub directly). */
export default function GithubPanel({ project, canManage, onProjectUpdated }) {
  const [repo, setRepo] = useState(null)
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(false)
  const [repoError, setRepoError] = useState('')
  const [commitsError, setCommitsError] = useState('')
  const [linking, setLinking] = useState(false)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [confirmUnlink, setConfirmUnlink] = useState(false)

  const load = useCallback(async () => {
    if (!project.github_repo_url) return
    setLoading(true)
    setRepoError('')
    setCommitsError('')
    const [repoRes, commitsRes] = await Promise.allSettled([
      getProjectGithubRepo(project.id),
      getProjectGithubCommits(project.id),
    ])
    if (repoRes.status === 'fulfilled') setRepo(repoRes.value)
    else { setRepo(null); setRepoError(errorText(repoRes.reason, 'Could not reach GitHub.')) }
    if (commitsRes.status === 'fulfilled') setCommits(commitsRes.value || [])
    else { setCommits([]); setCommitsError(errorText(commitsRes.reason, 'Could not load commits.')) }
    setLoading(false)
  }, [project.id, project.github_repo_url])

  useEffect(() => { load() }, [load])

  async function link(e) {
    e.preventDefault()
    if (!url.trim()) return
    setBusy(true)
    setFormError('')
    try {
      const updated = await linkProjectGithub(project.id, url.trim())
      setLinking(false)
      setUrl('')
      onProjectUpdated(updated)
    } catch (err) {
      setFormError(errorText(err, 'Could not link that repository.'))
    } finally {
      setBusy(false)
    }
  }

  async function unlink() {
    setBusy(true)
    try {
      const updated = await unlinkProjectGithub(project.id)
      setRepo(null)
      setCommits([])
      setConfirmUnlink(false)
      onProjectUpdated(updated)
    } catch (err) {
      setFormError(errorText(err, 'Could not unlink the repository.'))
      setConfirmUnlink(false)
    } finally {
      setBusy(false)
    }
  }

  const linkForm = (
    <form onSubmit={link} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: 520 }}>
      <input
        className="input"
        style={{ flex: '1 1 260px' }}
        type="url"
        placeholder="https://github.com/owner/repository"
        value={url}
        onChange={e => setUrl(e.target.value)}
        aria-label="Public GitHub repository URL"
        required
        autoFocus
      />
      <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Verifying…' : 'Link repository'}</button>
      {project.github_repo_url && <button type="button" className="btn btn-ghost" onClick={() => setLinking(false)}>Cancel</button>}
    </form>
  )

  if (!project.github_repo_url) {
    return (
      <div className="panel">
        <EmptyState icon={IconGitHub} title="No repository linked">
          {canManage ? 'Link a public GitHub repository to show its metadata and recent commits here.' : 'A project manager can link the team’s GitHub repository.'}
        </EmptyState>
        {canManage && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 16px 28px' }}>{linkForm}{formError && <div className="alert alert-danger">{formError}</div>}</div>}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="panel">
        <div className="panel-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <IconGitHub size={18} />
            <a href={project.github_repo_url} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {repo?.full_name ?? project.github_repo_url.replace('https://github.com/', '')}
            </a>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
            {canManage && !linking && <button className="btn btn-ghost btn-sm" onClick={() => setLinking(true)}>Change</button>}
            {canManage && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-text)' }} onClick={() => setConfirmUnlink(true)}>Unlink</button>}
          </div>
        </div>
        <div className="panel-body">
          {linking && <div style={{ marginBottom: 12 }}>{linkForm}</div>}
          {formError && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{formError}</div>}
          {loading && !repo ? <Skeleton rows={2} /> : repoError ? (
            <div className="alert alert-warning">{repoError}</div>
          ) : repo && (
            <>
              {repo.description && <p style={{ margin: '0 0 12px', fontSize: 13.5 }}>{repo.description}</p>}
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13 }} className="muted">
                {repo.language && <span>{repo.language}</span>}
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconGitBranch size={14} />{repo.default_branch}</span>
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconStar size={14} />{repo.stars_count.toLocaleString()} stars</span>
                <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><IconGitFork size={14} />{repo.forks_count.toLocaleString()} forks</span>
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>Open on GitHub <IconExternalLink size={13} /></a>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3 className="section-title">Recent commits</h3>
          {!loading && !commitsError && <span className="faint" style={{ fontSize: 12 }}>{commits.length} shown</span>}
        </div>
        {loading ? <Skeleton rows={4} /> : commitsError ? (
          <div className="panel-body"><div className="alert alert-warning">{commitsError}</div></div>
        ) : commits.length === 0 ? (
          <EmptyState icon={IconGitCommit} title="No commits yet">This repository has no commits on its default branch.</EmptyState>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {commits.map(c => (
              <li key={c.sha} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" width={24} height={24} style={{ borderRadius: '50%', flexShrink: 0 }} loading="lazy" />
                  : <span className="avatar-xs" aria-hidden="true">{c.author_name.slice(0, 1)}</span>}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message.split('\n')[0]}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{c.author_name} · {timeAgo(c.author_date)}</div>
                </div>
                <a href={c.html_url} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 12 }} aria-label={`Commit ${c.short_sha} on GitHub`}>{c.short_sha}</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmUnlink && (
        <Dialog
          title="Unlink repository?"
          onClose={() => setConfirmUnlink(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setConfirmUnlink(false)} data-autofocus>Cancel</button>
            <button className="btn btn-destructive" onClick={unlink} disabled={busy}>{busy ? 'Unlinking…' : 'Unlink'}</button>
          </>}
        >
          <p style={{ margin: 0, fontSize: 13.5 }}>The project will stop showing repository data. Nothing on GitHub is changed.</p>
        </Dialog>
      )}
    </div>
  )
}
