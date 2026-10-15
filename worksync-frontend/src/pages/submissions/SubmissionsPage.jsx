import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  listSubmissions,
  getSubmission,
  getTaskSubmissions,
  reviewSubmission,
  submitTaskWork,
  downloadSubmissionFile,
  buildSubmissionForm,
} from '../../api/submissionsApi'
import { IconAttachments, IconGitHub, IconInbox } from '../../components/common/WorkSyncIcons'
import { Dialog } from '../../components/ui/Primitives'

const STATUS_META = {
  PENDING: { label: 'Submitted', badge: 'badge-warning' },
  IN_REVIEW: { label: 'In Review', badge: 'badge-inreview' },
  CHANGES_REQUESTED: { label: 'Changes Requested', badge: 'badge-danger' },
  APPROVED: { label: 'Approved', badge: 'badge-success' },
}

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Submitted' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'CHANGES_REQUESTED', label: 'Changes Requested' },
  { value: 'APPROVED', label: 'Approved' },
]

const MIN_FEEDBACK = 5

function errorText(err, fallback) {
  const detail = err?.response?.data?.detail
  return typeof detail === 'string' ? detail : fallback
}

function formatDate(iso) {
  return iso ? new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).toLocaleString() : ''
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, badge: 'badge-todo' }
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>
}

export default function SubmissionsPage() {
  const { role, user } = useAuth()
  const isReviewer = role === 'ADMIN' || role === 'MANAGER'
  const [searchParams, setSearchParams] = useSearchParams()
  const openId = searchParams.get('open')

  const [filter, setFilter] = useState(isReviewer ? 'PENDING' : '')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [detailError, setDetailError] = useState('')
  const [notice, setNotice] = useState('')

  const loadList = useCallback(() => {
    setLoading(true)
    setListError('')
    listSubmissions(filter || null)
      .then(setItems)
      .catch(err => setListError(errorText(err, 'Failed to load submissions.')))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { loadList() }, [loadList])

  const openSubmission = useCallback(id => {
    setDetailError('')
    getSubmission(id)
      .then(sub => {
        setSelected(sub)
        return getTaskSubmissions(sub.task_id).then(setHistory)
      })
      .catch(err => {
        setSelected(null)
        setDetailError(errorText(err, 'Failed to load submission.'))
      })
  }, [])

  useEffect(() => {
    if (openId) openSubmission(openId)
  }, [openId, openSubmission])

  function select(id) {
    setNotice('')
    setSearchParams({ open: String(id) })
  }

  function afterChange(sub, message) {
    setNotice(message)
    loadList()
    if (String(sub.id) === openId) openSubmission(sub.id)
    else setSearchParams({ open: String(sub.id) })
  }

  return (
    <div style={{ maxWidth: 'none', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">
          {isReviewer ? 'Review Queue' : 'My Submissions'}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {isReviewer
            ? 'Inspect deliverables, give feedback, and approve or request changes'
            : 'Track review status, read feedback, and submit revisions'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* List */}
        <div className="card" style={{ padding: '1rem' }}>
          {listError && <div className="alert alert-danger">{listError}</div>}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
              <IconInbox size={36} style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }} />
              <div>
                {isReviewer
                  ? 'No submissions match this filter.'
                  : 'No submissions yet. Use "Submit Work" on the dashboard to send a deliverable.'}
              </div>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {items.map(s => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => select(s.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.8rem 0.9rem',
                      borderRadius: 10,
                      cursor: 'pointer',
                      border: `1px solid ${selected?.id === s.id ? 'var(--accent)' : 'var(--border-color)'}`,
                      backgroundColor: selected?.id === s.id ? 'var(--accent-soft)' : 'var(--surface-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.task_title}</strong>
                      <StatusBadge status={s.status} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      v{s.version} · {s.project_name} · {isReviewer ? `${s.submitter_name} · ` : ''}{formatDate(s.submitted_at)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {notice && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{notice}</div>}
          {detailError && <div className="alert alert-danger">{detailError}</div>}
          {!selected ? (
            !detailError && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Select a submission to see details and review history.
              </div>
            )
          ) : (
            <SubmissionDetail
              key={selected.id}
              submission={selected}
              history={history}
              isReviewer={isReviewer}
              currentUserId={user?.id}
              onChanged={afterChange}
              onSelect={select}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SubmissionDetail({ submission: s, history, isReviewer, currentUserId, onChanged, onSelect }) {
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(null) // APPROVED | CHANGES_REQUESTED awaiting confirmation

  const latest = history[0]
  const canDecide = isReviewer && (s.status === 'PENDING' || s.status === 'IN_REVIEW')
  const canRevise =
    !isReviewer &&
    s.submitted_by === currentUserId &&
    latest?.id === s.id &&
    s.status === 'CHANGES_REQUESTED'

  function decide(status) {
    setError('')
    if (status === 'CHANGES_REQUESTED' && feedback.trim().length < MIN_FEEDBACK) {
      setError('Explain what needs to change (at least 5 characters).')
      return
    }
    if (status === 'IN_REVIEW') save(status)
    else setConfirming(status)
  }

  async function save(status) {
    setConfirming(null)
    setBusy(true)
    try {
      const updated = await reviewSubmission(s.id, { status, review_comment: feedback.trim() || undefined })
      const labels = { IN_REVIEW: 'Marked as in review.', APPROVED: 'Submission approved.', CHANGES_REQUESTED: 'Changes requested — the member has been notified.' }
      onChanged(updated, labels[status])
    } catch (err) {
      setError(errorText(err, 'Failed to save review.'))
    } finally {
      setBusy(false)
    }
  }

  async function download(sub) {
    setError('')
    try {
      await downloadSubmissionFile(sub)
    } catch (err) {
      setError(errorText(err, 'Could not download the file.'))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.task_title}</h2>
          <StatusBadge status={s.status} />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
          {s.project_name} · Revision {s.version} · by <strong>{s.submitter_name}</strong> · {formatDate(s.submitted_at)}
        </div>
      </div>

      <SubmissionContent sub={s} onDownload={download} />

      {s.review_comment && (
        <div className={`alert ${s.status === 'APPROVED' ? 'alert-success' : 'alert-warning'}`}>
          <div>
            <strong>Feedback from {s.reviewer_name || 'reviewer'}:</strong>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{s.review_comment}</div>
          </div>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {canDecide && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label htmlFor="review-feedback" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Feedback <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(required to request changes)</span>
          </label>
          <textarea
            id="review-feedback"
            className="input"
            rows={3}
            maxLength={2000}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="What works, what needs to change…"
            style={{ fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {s.status === 'PENDING' && (
              <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => decide('IN_REVIEW')}>
                Mark In Review
              </button>
            )}
            <button type="button" className="btn btn-destructive btn-sm" disabled={busy} onClick={() => decide('CHANGES_REQUESTED')}>
              Request Changes
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => decide('APPROVED')}>
              Approve
            </button>
          </div>
        </div>
      )}

      {canRevise && <RevisionForm submission={s} onSubmitted={onChanged} />}

      {confirming && (
        <Dialog
          title={confirming === 'APPROVED' ? 'Approve this submission?' : 'Request changes?'}
          onClose={() => setConfirming(null)}
          footer={<>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(null)} data-autofocus>Cancel</button>
            <button type="button" className={`btn ${confirming === 'APPROVED' ? 'btn-primary' : 'btn-destructive'}`} onClick={() => save(confirming)}>
              {confirming === 'APPROVED' ? 'Approve' : 'Send feedback'}
            </button>
          </>}
        >
          <p style={{ margin: 0, fontSize: 13.5 }}>
            {confirming === 'APPROVED'
              ? `Revision ${s.version} of “${s.task_title}” will be approved and the task marked completed. This decision is final.`
              : `${s.submitter_name} will be notified and can submit revision ${s.version + 1}.`}
          </p>
        </Dialog>
      )}

      {history.length > 1 && (
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <h3 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', fontWeight: 700 }}>Revision History</h3>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.map(h => (
              <li
                key={h.id}
                style={{ padding: '0.65rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: h.id === s.id ? 'var(--accent-soft)' : 'var(--surface-card)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onSelect(h.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: 'var(--accent-text)' }}
                  >
                    Revision {h.version}
                  </button>
                  <StatusBadge status={h.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Submitted {formatDate(h.submitted_at)}
                  {h.reviewed_at && ` · reviewed by ${h.reviewer_name} ${formatDate(h.reviewed_at)}`}
                </div>
                {h.review_comment && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                    “{h.review_comment}”
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function SubmissionContent({ sub, onDownload }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {sub.comment && (
        <div style={{ padding: '0.8rem', backgroundColor: 'var(--surface-subtle)', borderRadius: 8, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
          {sub.comment}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {sub.github_url && (
          <a className="btn btn-secondary btn-sm" href={sub.github_url} target="_blank" rel="noopener noreferrer">
            <IconGitHub size={16} /> Open GitHub link
          </a>
        )}
        {sub.has_file && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDownload(sub)}>
            <IconAttachments size={16} /> {sub.original_filename || 'Download file'}
          </button>
        )}
      </div>
    </div>
  )
}

/** Submit form shared by the dashboard (first submission) and the revision flow. */
export function SubmissionFields({ comment, setComment, githubUrl, setGithubUrl, setFile }) {
  return (
    <>
      <div>
        <label htmlFor="sub-notes" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Notes</label>
        <textarea
          id="sub-notes"
          className="input"
          rows={3}
          maxLength={2000}
          placeholder="Summary of the work, what changed, how to test it…"
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ fontFamily: 'inherit' }}
        />
      </div>
      <div>
        <label htmlFor="sub-github" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>GitHub link (repo, commit or PR)</label>
        <input
          id="sub-github"
          className="input"
          type="url"
          pattern="https://(www\.)?github\.com/.+/.+"
          placeholder="https://github.com/owner/repo/commit/…"
          value={githubUrl}
          onChange={e => setGithubUrl(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="sub-file" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
          File <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optional, max 10 MB — PDF, Office, images, text, zip)</span>
        </label>
        <input
          id="sub-file"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.zip"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
      </div>
    </>
  )
}

function RevisionForm({ submission, onSubmitted }) {
  const [comment, setComment] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comment.trim() && !githubUrl.trim() && !file) {
      setError('Add notes, a GitHub link, or a file.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const created = await submitTaskWork(submission.task_id, buildSubmissionForm({ comment, githubUrl, file }))
      onSubmitted(created, `Revision ${created.version} submitted for review.`)
    } catch (err) {
      setError(errorText(err, 'Failed to submit revision.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Submit Revision {submission.version + 1}</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <SubmissionFields comment={comment} setComment={setComment} githubUrl={githubUrl} setGithubUrl={setGithubUrl} setFile={setFile} />
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Revision'}
        </button>
      </div>
    </form>
  )
}
