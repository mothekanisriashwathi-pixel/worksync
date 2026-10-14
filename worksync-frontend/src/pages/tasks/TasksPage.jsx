import { useState, useEffect } from 'react'
import { getTasks, createTask, updateTask, deleteTask } from '../../api/tasksApi'
import { getProjects } from '../../api/projectsApi'
import { getTeamMembers } from '../../api/teamsApi'
import {
  IconAdd,
  IconClose,
  IconTasks,
} from '../../components/common/WorkSyncIcons'

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: '#9E8FAA', bg: '#f5f0f0' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#0097a7', bg: 'rgba(38, 198, 218, 0.15)' },
  { id: 'IN_REVIEW', label: 'In Review', color: '#b45309', bg: '#fef3c7' },
  { id: 'COMPLETED', label: 'Completed', color: '#15803d', bg: '#dcfce7' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [columnStatus, setColumnStatus] = useState('TODO')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  // When taskProjectId changes in modal, load that project's team members
  useEffect(() => {
    if (!taskProjectId) return
    const proj = projects.find(p => String(p.id) === String(taskProjectId))
    if (proj?.team_id) {
      getTeamMembers(proj.team_id)
        .then(members => {
          setTeamMembers(members || [])
          if (members && members.length > 0) {
            setAssignedTo(String(members[0].user_id))
          } else {
            setAssignedTo('')
          }
        })
        .catch(err => {
          console.error('Error loading team members for project:', err)
          setTeamMembers([])
        })
    }
  }, [taskProjectId, projects])

  function loadData() {
    setLoading(true)
    setPageError('')
    Promise.all([
      getTasks().catch(err => {
        console.error('Error fetching tasks:', err)
        return []
      }),
      getProjects().catch(err => {
        console.error('Error fetching projects:', err)
        return []
      }),
    ])
      .then(([tasksData, projectsData]) => {
        setTasks(tasksData || [])
        setProjects(projectsData || [])
        if (projectsData && projectsData.length > 0) {
          setTaskProjectId(String(projectsData[0].id))
        }
      })
      .catch(err => {
        console.error('Failed to load tasks page:', err)
        setPageError('Failed to load tasks or projects.')
      })
      .finally(() => setLoading(false))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim()) return
    setErrorMsg('')

    if (!taskProjectId) {
      setErrorMsg('Please select a project for this task.')
      return
    }

    if (!assignedTo) {
      setErrorMsg('Please select a team member to assign this task to. Ensure the project team has members.')
      return
    }

    setSubmitting(true)

    const payload = {
      title: title.trim(),
      description: desc.trim() || undefined,
      priority,
      status: columnStatus,
      project_id: parseInt(taskProjectId, 10),
      assigned_to: parseInt(assignedTo, 10),
    }

    try {
      const created = await createTask(payload)
      setTasks(prev => [created, ...prev])
      setModalOpen(false)
      setTitle('')
      setDesc('')
    } catch (err) {
      console.error('Failed to create task:', err)
      const detail = err?.response?.data?.detail
      setErrorMsg(typeof detail === 'string' ? detail : 'Failed to create task. Verify assignment and team permissions.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(taskId, newStatus) {
    try {
      const updated = await updateTask(taskId, { status: newStatus })
      setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)))
    } catch (err) {
      console.error('Failed to update task status:', err)
      const detail = err?.response?.data?.detail
      alert(typeof detail === 'string' ? detail : 'Failed to update task status.')
    }
  }

  async function handleDelete(taskId) {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    try {
      await deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      console.error('Failed to delete task:', err)
      const detail = err?.response?.data?.detail
      alert(typeof detail === 'string' ? detail : 'Failed to delete task.')
    }
  }

  const filteredTasks = tasks.filter(t => {
    const matchesProject = selectedProjectId === 'ALL' || String(t.project_id) === String(selectedProjectId)
    const matchesSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    return matchesProject && matchesSearch
  })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A2E', margin: '0 0 0.35rem 0' }}>
            Tasks
          </h1>
          <p style={{ margin: 0, color: '#777184', fontSize: '0.95rem' }}>
            Kanban board workflow — move, organize, and track task deliverables
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: 8,
                border: '1px solid #d0c6d8',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: '#fff',
              }}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 8,
              border: '1px solid #d0c6d8',
              fontSize: '0.9rem',
              outline: 'none',
              width: 220,
            }}
          />
          <button
            type="button"
            onClick={() => {
              setErrorMsg('')
              setModalOpen(true)
            }}
            disabled={projects.length === 0}
            title={projects.length === 0 ? 'Create a project first' : 'Add task'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              borderRadius: 8,
              backgroundColor: projects.length === 0 ? '#d0c6d8' : '#26C6DA',
              color: '#1A1A2E',
              fontWeight: 700,
              border: 'none',
              cursor: projects.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(38, 198, 218, 0.3)',
            }}
          >
            <IconAdd size={18} />
            New Task
          </button>
        </div>
      </div>

      {pageError && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.9rem' }}>
          {pageError}
        </div>
      )}

      {/* Kanban Board */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#777184' }}>
          <span className="spinner spinner-lg" style={{ display: 'inline-block', marginBottom: '1rem' }} />
          <div>Loading tasks...</div>
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E9E3EE' }}>
          <IconTasks size={48} style={{ color: '#9E8FAA', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1A1A2E' }}>No Projects Available</h3>
          <p style={{ color: '#777184', margin: '0 0 1rem 0' }}>
            You need to create a project first before tasks can be added to the board.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'flex-start' }}>
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => (t.status || 'TODO') === col.id)
            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #E9E3EE',
                  padding: '1rem',
                  minHeight: 450,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f0edf4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1A1A2E' }}>{col.label}</h3>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: col.bg, color: col.color }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Tasks Column List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9E8FAA', fontSize: '0.825rem' }}>
                      No tasks in {col.label.toLowerCase()}
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const projName = projects.find(p => p.id === task.project_id)?.name || `Project #${task.project_id}`
                      return (
                        <div
                          key={task.id}
                          style={{
                            backgroundColor: '#faf8fc',
                            borderRadius: 8,
                            border: '1px solid #ede8f5',
                            padding: '1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: task.priority === 'URGENT' ? '#fee2e2' : task.priority === 'HIGH' ? '#ffedd5' : '#f1f5f9',
                              color: task.priority === 'URGENT' ? '#b91c1c' : task.priority === 'HIGH' ? '#c2410c' : '#475569',
                            }}>
                              {task.priority || 'MEDIUM'}
                            </span>
                            <button
                              onClick={() => handleDelete(task.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9E8FAA', padding: 2 }}
                              title="Delete task"
                            >
                              ✕
                            </button>
                          </div>

                          <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.925rem', fontWeight: 700, color: '#1A1A2E' }}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#6d617a', lineHeight: 1.4 }}>
                              {task.description}
                            </p>
                          )}

                          <div style={{ fontSize: '0.725rem', color: '#9E8FAA', marginBottom: '0.5rem' }}>
                            📁 {projName}
                          </div>

                          {/* Move Status Selector */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ede8f5', paddingTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: '#9E8FAA' }}>Move:</span>
                            <select
                              value={task.status || 'TODO'}
                              onChange={e => handleStatusChange(task.id, e.target.value)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: '1px solid #d0c6d8',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                              }}
                            >
                              {COLUMNS.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
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
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 460, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Create New Task</h3>
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement OAuth JWT Refresh"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, instructions or checklists..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Project</label>
                <select
                  value={taskProjectId}
                  onChange={e => setTaskProjectId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (ID: #{p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Assignee (Team Member)</label>
                {teamMembers.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: 6 }}>
                    No members found in this project's team. Please add members to the team first.
                  </div>
                ) : (
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    {teamMembers.map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user?.name || `User #${m.user_id}`} ({m.user?.email || 'member'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Initial Status</label>
                  <select
                    value={columnStatus}
                    onChange={e => setColumnStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
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
                  disabled={submitting || teamMembers.length === 0}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: 8,
                    border: 'none',
                    background: teamMembers.length === 0 ? '#d0c6d8' : '#26C6DA',
                    color: '#1A1A2E',
                    cursor: teamMembers.length === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {submitting ? 'Adding...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
