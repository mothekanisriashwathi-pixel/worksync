import { useState, useEffect } from 'react'
import { getProjects, createProject, deleteProject } from '../../api/projectsApi'
import { getTeams } from '../../api/teamsApi'
import { useAuth } from '../../context/AuthContext'
import {
  IconProjects,
  IconAdd,
  IconClose,
  IconGitHub,
} from '../../components/common/WorkSyncIcons'
import ProjectDetailsModal from '../../components/projects/ProjectDetailsModal'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [status, setStatus] = useState('PLANNING')
  const [teamId, setTeamId] = useState('')
  const [githubRepoUrl, setGithubRepoUrl] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  function loadData() {
    setLoading(true)
    setPageError('')
    Promise.all([
      getProjects(),
      getTeams().catch(() => []),
    ])
      .then(([projectsData, teamsData]) => {
        setProjects(projectsData || [])
        setTeams(teamsData || [])
        if (teamsData && teamsData.length > 0 && !teamId) {
          setTeamId(String(teamsData[0].id))
        }
      })
      .catch(err => {
        console.error('Error loading projects:', err)
        setPageError('Failed to load projects from server.')
      })
      .finally(() => setLoading(false))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setErrorMsg('')

    const selectedTeamId = teamId ? parseInt(teamId, 10) : (teams[0]?.id || 1)

    const payload = {
      name: name.trim(),
      description: desc.trim() || undefined,
      status,
      team_id: selectedTeamId,
      github_repo_url: githubRepoUrl.trim() || undefined,
      start_date: startDate || undefined,
      due_date: dueDate || undefined,
    }

    try {
      const created = await createProject(payload)
      setProjects(prev => [created, ...prev])
      setModalOpen(false)
      setName('')
      setDesc('')
      setGithubRepoUrl('')
      setStartDate('')
      setDueDate('')
    } catch (err) {
      console.error('Failed to create project:', err)
      const detail = err?.response?.data?.detail
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to create project. Please verify inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this project? Its associated tasks will also be removed.')) {
      return
    }
    try {
      await deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Failed to delete project:', err)
      const detail = err?.response?.data?.detail
      alert(typeof detail === 'string' ? detail : 'Failed to delete project.')
    }
  }

  const filtered = projects.filter(p => {
    const matchesFilter = filter === 'ALL' || p.status === filter
    const matchesSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A2E', margin: '0 0 0.35rem 0' }}>
            Projects
          </h1>
          <p style={{ margin: 0, color: '#777184', fontSize: '0.95rem' }}>
            Manage and track active team initiatives and roadmaps
          </p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            setErrorMsg('')
            setModalOpen(true)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            borderRadius: 8,
            backgroundColor: '#26C6DA',
            color: '#1A1A2E',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(38, 198, 218, 0.3)',
          }}
        >
          <IconAdd size={18} />
          New Project
        </button>
      </div>

      {pageError && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.9rem' }}>
          {pageError}
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(38, 198, 218, 0.12)', padding: 4, borderRadius: 8 }}>
          {['ALL', 'PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 6,
                fontSize: '0.825rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filter === tab ? '#26C6DA' : 'transparent',
                color: filter === tab ? '#1A1A2E' : '#2E3A4B',
                transition: 'all 0.2s',
              }}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: 8,
            border: '1px solid #d0c6d8',
            fontSize: '0.9rem',
            width: 240,
            outline: 'none',
          }}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#777184' }}>
          <span className="spinner spinner-lg" style={{ display: 'inline-block', marginBottom: '1rem' }} />
          <div>Loading projects...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E9E3EE' }}>
          <IconProjects size={48} style={{ color: '#9E8FAA', marginBottom: '1rem' }} />
          <p style={{ color: '#777184', margin: '0 0 1rem 0', fontWeight: 600 }}>
            {projects.length === 0 ? 'No projects found in the database.' : 'No projects match your current filter.'}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 6, backgroundColor: '#26C6DA', color: '#1A1A2E', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(proj => {
            const progress = proj.status === 'COMPLETED' ? 100 : proj.status === 'IN_PROGRESS' ? 50 : 0
            return (
              <div
                key={proj.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #E9E3EE',
                  padding: '1.5rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: proj.status === 'COMPLETED' ? '#dcfce7' : proj.status === 'IN_PROGRESS' ? 'rgba(38, 198, 218, 0.15)' : '#fef3c7',
                      color: proj.status === 'COMPLETED' ? '#15803d' : proj.status === 'IN_PROGRESS' ? '#0097a7' : '#b45309',
                    }}>
                      {proj.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      title="Delete project"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8FAA', padding: 4 }}
                    >
                      ✕
                    </button>
                  </div>

                  <h3
                    onClick={() => setSelectedProject(proj)}
                    style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700, color: '#1A1A2E', cursor: 'pointer' }}
                  >
                    {proj.name}
                  </h3>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#4e4059', lineHeight: 1.5 }}>
                    {proj.description || 'No description provided.'}
                  </p>

                  {proj.github_repo_url && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginBottom: '1rem',
                        padding: '3px 8px',
                        borderRadius: 12,
                        backgroundColor: '#f6f8fa',
                        border: '1px solid #d0d7de',
                        fontSize: '0.72rem',
                        color: '#24292e',
                        fontWeight: 600,
                        maxWidth: '100%',
                      }}
                    >
                      <IconGitHub size={13} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {proj.github_repo_url.replace(/^https?:\/\/(www\.)?github\.com\//i, '')}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#777184', marginBottom: '0.4rem' }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: 700, color: '#0097a7' }}>{progress}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: '#E9E3EE', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#26C6DA' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#9E8FAA', borderTop: '1px solid #f5f0f0', paddingTop: '0.75rem' }}>
                    <span>Due: {proj.due_date || 'Ongoing'}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProject(proj)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: 6,
                        border: '1px solid rgba(38, 198, 218, 0.5)',
                        backgroundColor: 'rgba(38, 198, 218, 0.08)',
                        color: '#0097a7',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <IconGitHub size={13} />
                      GitHub & Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Create New Project</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}>
                <IconClose size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '0.65rem 0.85rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure Migration"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Goals, team scope, deliverables..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  GitHub Repository URL <span style={{ color: '#777184', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/owner/repository"
                  value={githubRepoUrl}
                  onChange={e => setGithubRepoUrl(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                />
              </div>

              {teams.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Team</label>
                  <select
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (ID: #{t.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: '1px solid #d0c6d8', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.65rem 1.4rem', borderRadius: 8, border: 'none', background: '#26C6DA', color: '#1A1A2E', cursor: 'pointer', fontWeight: 700 }}
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Details & GitHub Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onProjectUpdated={(updated) => {
            setProjects(prev => prev.map(p => (p.id === updated.id ? updated : p)))
            setSelectedProject(updated)
          }}
          canManage={user?.role === 'ADMIN' || user?.role === 'MANAGER'}
        />
      )}
    </div>
  )
}
