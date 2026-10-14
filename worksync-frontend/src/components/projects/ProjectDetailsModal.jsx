import { useState, useEffect } from 'react'
import {
  getProjectGithubRepo,
  getProjectGithubCommits,
  linkProjectGithub,
  unlinkProjectGithub,
} from '../../api/projectsApi'
import {
  IconClose,
  IconGitHub,
  IconGitBranch,
  IconGitCommit,
  IconGitFork,
  IconStar,
  IconExternalLink,
  IconProjects,
  IconCalendar,
} from '../common/WorkSyncIcons'

function formatDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function timeAgo(isoString) {
  if (!isoString) return ''
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return formatDate(isoString)
  } catch {
    return isoString
  }
}

export default function ProjectDetailsModal({
  project,
  onClose,
  onProjectUpdated,
  canManage,
}) {
  const [activeTab, setActiveTab] = useState(project.github_repo_url ? 'github' : 'overview')
  
  // GitHub data states
  const [repoInfo, setRepoInfo] = useState(null)
  const [commits, setCommits] = useState([])
  const [loadingGithub, setLoadingGithub] = useState(false)
  const [githubError, setGithubError] = useState('')

  // Linking form states
  const [isLinking, setIsLinking] = useState(false)
  const [repoUrlInput, setRepoUrlInput] = useState('')
  const [submittingLink, setSubmittingLink] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')

  useEffect(() => {
    if (project.github_repo_url) {
      loadGithubData()
    } else {
      setRepoInfo(null)
      setCommits([])
      setGithubError('')
    }
  }, [project.id, project.github_repo_url])

  async function loadGithubData() {
    setLoadingGithub(true)
    setGithubError('')
    try {
      const [repoData, commitsData] = await Promise.all([
        getProjectGithubRepo(project.id),
        getProjectGithubCommits(project.id).catch(() => []),
      ])
      setRepoInfo(repoData)
      setCommits(commitsData || [])
    } catch (err) {
      console.error('Failed to load GitHub data:', err)
      const detail = err?.response?.data?.detail
      setGithubError(typeof detail === 'string' ? detail : 'Unable to fetch GitHub repository details.')
    } finally {
      setLoadingGithub(false)
    }
  }

  async function handleLinkRepo(e) {
    e.preventDefault()
    if (!repoUrlInput.trim()) return
    setSubmittingLink(true)
    setLinkError('')
    setLinkSuccess('')

    try {
      const updated = await linkProjectGithub(project.id, repoUrlInput.trim())
      setLinkSuccess('Repository successfully linked!')
      setIsLinking(false)
      setRepoUrlInput('')
      onProjectUpdated(updated)
      // Switch to github tab and load data
      setActiveTab('github')
    } catch (err) {
      console.error('Failed to link GitHub repo:', err)
      const detail = err?.response?.data?.detail
      setLinkError(typeof detail === 'string' ? detail : 'Failed to link GitHub repository. Please verify the URL.')
    } finally {
      setSubmittingLink(false)
    }
  }

  async function handleUnlinkRepo() {
    if (!window.confirm('Are you sure you want to unlink this GitHub repository from the project?')) {
      return
    }
    setSubmittingLink(true)
    setLinkError('')
    setLinkSuccess('')

    try {
      const updated = await unlinkProjectGithub(project.id)
      setRepoInfo(null)
      setCommits([])
      setLinkSuccess('Repository unlinked.')
      onProjectUpdated(updated)
    } catch (err) {
      console.error('Failed to unlink GitHub repo:', err)
      const detail = err?.response?.data?.detail
      setLinkError(typeof detail === 'string' ? detail : 'Failed to unlink repository.')
    } finally {
      setSubmittingLink(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E9E3EE',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FAFAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: 'rgba(38, 198, 218, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0097a7',
              }}
            >
              <IconProjects size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1A1A2E' }}>
                  {project.name}
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor:
                      project.status === 'COMPLETED'
                        ? '#dcfce7'
                        : project.status === 'IN_PROGRESS'
                        ? 'rgba(38, 198, 218, 0.15)'
                        : '#fef3c7',
                    color:
                      project.status === 'COMPLETED'
                        ? '#15803d'
                        : project.status === 'IN_PROGRESS'
                        ? '#0097a7'
                        : '#b45309',
                  }}
                >
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#777184', marginTop: 2 }}>
                Project #{project.id} {project.team ? `• Team: ${project.team.name}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#777184',
              padding: 6,
              borderRadius: 6,
            }}
            title="Close modal"
          >
            <IconClose size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            padding: '0 1.5rem',
            borderBottom: '1px solid #E9E3EE',
            gap: '1rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'overview' ? 700 : 500,
              color: activeTab === 'overview' ? '#0097a7' : '#777184',
              borderBottom: activeTab === 'overview' ? '2px solid #0097a7' : '2px solid transparent',
            }}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'github' ? 700 : 500,
              color: activeTab === 'github' ? '#0097a7' : '#777184',
              borderBottom: activeTab === 'github' ? '2px solid #0097a7' : '2px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
            }}
          >
            <IconGitHub size={16} />
            GitHub Repository
            {project.github_repo_url && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                }}
              />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Notifications */}
          {linkSuccess && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                borderRadius: 8,
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              {linkSuccess}
            </div>
          )}
          {linkError && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                borderRadius: 8,
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              {linkError}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#1A1A2E' }}>
                  Description
                </h4>
                <p style={{ margin: 0, color: '#4e4059', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {project.description || 'No description provided for this project.'}
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#FAFAFC',
                  borderRadius: 10,
                  border: '1px solid #E9E3EE',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#777184', fontWeight: 600 }}>Start Date</div>
                  <div style={{ fontSize: '0.9rem', color: '#1A1A2E', fontWeight: 500, marginTop: 4 }}>
                    {project.start_date || 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#777184', fontWeight: 600 }}>Due Date</div>
                  <div style={{ fontSize: '0.9rem', color: '#1A1A2E', fontWeight: 500, marginTop: 4 }}>
                    {project.due_date || 'Ongoing'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#777184', fontWeight: 600 }}>Team</div>
                  <div style={{ fontSize: '0.9rem', color: '#1A1A2E', fontWeight: 500, marginTop: 4 }}>
                    {project.team?.name || `Team #${project.team_id}`}
                  </div>
                </div>
              </div>

              {/* Quick GitHub teaser card */}
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: 12,
                  border: '1px dashed #d0c6d8',
                  backgroundColor: '#fbfbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <IconGitHub size={28} style={{ color: '#24292e' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1A2E' }}>
                      {project.github_repo_url ? 'GitHub Repository Connected' : 'Connect GitHub Repository'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#777184' }}>
                      {project.github_repo_url
                        ? project.github_repo_url
                        : 'Track code commits, repository health, and activity.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('github')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 8,
                    border: '1px solid #d0c6d8',
                    backgroundColor: '#fff',
                    color: '#1A1A2E',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {project.github_repo_url ? 'View Commits' : 'Configure'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB */}
          {activeTab === 'github' && (
            <div>
              {/* UNLINKED STATE */}
              {!project.github_repo_url && !isLinking && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1.5rem',
                    backgroundColor: '#FAFAFC',
                    borderRadius: 12,
                    border: '1px dashed #d0c6d8',
                  }}
                >
                  <IconGitHub size={48} style={{ color: '#9E8FAA', marginBottom: '1rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1A1A2E' }}>
                    No GitHub Repository Linked
                  </h4>
                  <p
                    style={{
                      margin: '0 auto 1.5rem auto',
                      maxWidth: 420,
                      fontSize: '0.875rem',
                      color: '#777184',
                      lineHeight: 1.5,
                    }}
                  >
                    Link a public GitHub repository to view live repository metrics, language stats, and recent
                    commits directly in WorkSync.
                  </p>

                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLinking(true)
                        setLinkError('')
                      }}
                      style={{
                        padding: '0.65rem 1.4rem',
                        borderRadius: 8,
                        backgroundColor: '#24292e',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <IconGitHub size={18} />
                      Link Public Repository
                    </button>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.825rem',
                        color: '#777184',
                        backgroundColor: '#f3f4f6',
                        padding: '0.5rem 1rem',
                        borderRadius: 6,
                        display: 'inline-block',
                      }}
                    >
                      Only team managers or administrators can link a repository.
                    </div>
                  )}
                </div>
              )}

              {/* LINKING / EDIT FORM */}
              {(!project.github_repo_url && isLinking) || (project.github_repo_url && isLinking) ? (
                <div
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#FAFAFC',
                    borderRadius: 12,
                    border: '1px solid #E9E3EE',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1A1A2E' }}>
                      {project.github_repo_url ? 'Update GitHub Repository' : 'Link GitHub Repository'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLinking(false)
                        setRepoUrlInput('')
                        setLinkError('')
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleLinkRepo}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#1A1A2E' }}>
                        GitHub Repository URL
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://github.com/owner/repository"
                        value={repoUrlInput}
                        onChange={e => setRepoUrlInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.9rem',
                          borderRadius: 8,
                          border: '1px solid #d0c6d8',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', color: '#777184', marginTop: '0.4rem' }}>
                        Must be a valid public GitHub URL (e.g., <code>https://github.com/torvalds/linux</code>).
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLinking(false)
                          setRepoUrlInput('')
                        }}
                        style={{
                          padding: '0.55rem 1rem',
                          borderRadius: 6,
                          border: '1px solid #d0c6d8',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingLink}
                        style={{
                          padding: '0.55rem 1.25rem',
                          borderRadius: 6,
                          border: 'none',
                          backgroundColor: '#24292e',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {submittingLink ? 'Verifying & Linking...' : 'Connect Repository'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              {/* LINKED STATE CONTENT */}
              {project.github_repo_url && !isLinking && (
                <div>
                  {/* Loading State */}
                  {loadingGithub && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#777184' }}>
                      <span className="spinner spinner-lg" style={{ display: 'inline-block', marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '0.9rem' }}>Fetching live information from GitHub...</div>
                    </div>
                  )}

                  {/* Error State */}
                  {githubError && !loadingGithub && (
                    <div
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#fef2f2',
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.95rem' }}>
                          ⚠️ Unable to load repository
                        </div>
                      </div>
                      <p style={{ margin: '0.4rem 0 1rem 0', fontSize: '0.85rem', color: '#991b1b' }}>
                        {githubError}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={loadGithubData}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: 6,
                            backgroundColor: '#dc2626',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Retry
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRepoUrlInput(project.github_repo_url)
                                setIsLinking(true)
                              }}
                              style={{
                                padding: '0.45rem 0.9rem',
                                borderRadius: 6,
                                border: '1px solid #d0c6d8',
                                backgroundColor: '#fff',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              Change URL
                            </button>
                            <button
                              type="button"
                              onClick={handleUnlinkRepo}
                              disabled={submittingLink}
                              style={{
                                padding: '0.45rem 0.9rem',
                                borderRadius: 6,
                                border: '1px solid #fca5a5',
                                backgroundColor: '#fff',
                                color: '#b91c1c',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              Unlink
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live Repo Metadata Header */}
                  {repoInfo && !loadingGithub && (
                    <div
                      style={{
                        padding: '1.25rem',
                        backgroundColor: '#ffffff',
                        borderRadius: 12,
                        border: '1px solid #E9E3EE',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        marginBottom: '1.5rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <IconGitHub size={24} style={{ color: '#24292e' }} />
                          <div>
                            <a
                              href={repoInfo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '1.15rem',
                                fontWeight: 800,
                                color: '#0969da',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              {repoInfo.full_name}
                              <IconExternalLink size={14} />
                            </a>
                            <div style={{ fontSize: '0.75rem', color: '#777184' }}>
                              Owner: <strong>{repoInfo.owner}</strong>
                            </div>
                          </div>
                        </div>

                        {canManage && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setRepoUrlInput(project.github_repo_url)
                                setIsLinking(true)
                              }}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 6,
                                border: '1px solid #d0c6d8',
                                backgroundColor: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#2E3A4B',
                                cursor: 'pointer',
                              }}
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={handleUnlinkRepo}
                              disabled={submittingLink}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 6,
                                border: '1px solid #fecaca',
                                backgroundColor: '#fff',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#dc2626',
                                cursor: 'pointer',
                              }}
                            >
                              Unlink
                            </button>
                          </div>
                        )}
                      </div>

                      {repoInfo.description && (
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#4e4059', lineHeight: 1.5 }}>
                          {repoInfo.description}
                        </p>
                      )}

                      {/* Repo Stats Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {repoInfo.default_branch && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '3px 9px',
                              borderRadius: 20,
                              backgroundColor: '#f6f8fa',
                              border: '1px solid #d0d7de',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#24292e',
                            }}
                          >
                            <IconGitBranch size={13} />
                            {repoInfo.default_branch}
                          </span>
                        )}

                        {repoInfo.language && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '3px 9px',
                              borderRadius: 20,
                              backgroundColor: 'rgba(38, 198, 218, 0.12)',
                              border: '1px solid rgba(38, 198, 218, 0.3)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#0097a7',
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#0097a7',
                              }}
                            />
                            {repoInfo.language}
                          </span>
                        )}

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '3px 9px',
                            borderRadius: 20,
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#b45309',
                          }}
                        >
                          <IconStar size={13} />
                          {repoInfo.stars_count?.toLocaleString?.() ?? repoInfo.stars_count} stars
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '3px 9px',
                            borderRadius: 20,
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#4b5563',
                          }}
                        >
                          <IconGitFork size={13} />
                          {repoInfo.forks_count?.toLocaleString?.() ?? repoInfo.forks_count} forks
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recent Commits Feed */}
                  {!loadingGithub && (
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.85rem',
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#1A1A2E',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                          }}
                        >
                          <IconGitCommit size={16} style={{ color: '#0097a7' }} />
                          Recent Commits
                          {commits.length > 0 && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '1px 6px',
                                borderRadius: 10,
                                backgroundColor: '#E9E3EE',
                                color: '#4e4059',
                              }}
                            >
                              {commits.length}
                            </span>
                          )}
                        </h4>

                        <button
                          type="button"
                          onClick={loadGithubData}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0097a7',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Refresh
                        </button>
                      </div>

                      {commits.length === 0 ? (
                        <div
                          style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: '#777184',
                            backgroundColor: '#FAFAFC',
                            borderRadius: 10,
                            border: '1px solid #E9E3EE',
                            fontSize: '0.85rem',
                          }}
                        >
                          No commits found on the default branch.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            maxHeight: 320,
                            overflowY: 'auto',
                          }}
                        >
                          {commits.map(c => (
                            <div
                              key={c.sha}
                              style={{
                                padding: '0.85rem 1rem',
                                backgroundColor: '#FAFAFC',
                                borderRadius: 8,
                                border: '1px solid #E9E3EE',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: '#1A1A2E',
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {c.message?.split('\n')[0]}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    marginTop: '0.35rem',
                                    fontSize: '0.75rem',
                                    color: '#777184',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {c.avatar_url ? (
                                    <img
                                      src={c.avatar_url}
                                      alt={c.author_name}
                                      style={{ width: 18, height: 18, borderRadius: '50%' }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderRadius: '50%',
                                        backgroundColor: '#d0c6d8',
                                        fontSize: '0.65rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        color: '#fff',
                                      }}
                                    >
                                      {c.author_name ? c.author_name[0].toUpperCase() : 'G'}
                                    </div>
                                  )}
                                  <span style={{ fontWeight: 600, color: '#2E3A4B' }}>{c.author_name}</span>
                                  <span>committed {timeAgo(c.author_date)}</span>
                                </div>
                              </div>

                              <a
                                href={c.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View commit on GitHub"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  backgroundColor: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.75rem',
                                  fontFamily: 'monospace',
                                  fontWeight: 600,
                                  color: '#0969da',
                                  textDecoration: 'none',
                                  flexShrink: 0,
                                }}
                              >
                                {c.short_sha}
                                <IconExternalLink size={11} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
