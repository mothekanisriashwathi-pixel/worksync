import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardSummary } from '../../api/dashboardApi'
import { createTask, updateTaskStatus } from '../../api/tasksApi'
import { getProjects } from '../../api/projectsApi'
import { getTeams, getTeamMembers } from '../../api/teamsApi'
import { submitTaskWork, reviewSubmission } from '../../api/submissionsApi'

import DashboardHeader from '../../components/dashboard/DashboardHeader'
import MetricCard from '../../components/dashboard/MetricCard'
import TaskStatusChart from '../../components/dashboard/TaskStatusChart'
import ProjectProgressCard from '../../components/dashboard/ProjectProgressCard'
import TeamWorkload from '../../components/dashboard/TeamWorkload'
import UpcomingDeadlines from '../../components/dashboard/UpcomingDeadlines'
import PendingReviews from '../../components/dashboard/PendingReviews'
import RecentActivity from '../../components/dashboard/RecentActivity'
import PlatformOverview from '../../components/dashboard/PlatformOverview'
import QuickActions from '../../components/dashboard/QuickActions'
import { LoadingState, ErrorState } from '../../components/dashboard/DashboardStates'
import { IconClose, IconAdd, IconCheck } from '../../components/common/WorkSyncIcons'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [activeView, setActiveView] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Action Modals
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [submitWorkOpen, setSubmitWorkOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedReviewItem, setSelectedReviewItem] = useState(null)

  // Create Task Form State
  const [allProjects, setAllProjects] = useState([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [taskAssigneeId, setTaskAssigneeId] = useState('')
  const [taskPriority, setTaskPriority] = useState('MEDIUM')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [projectMembers, setProjectMembers] = useState([])
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskError, setTaskError] = useState('')

  // Submit Work Form State
  const [submitTaskId, setSubmitTaskId] = useState('')
  const [submitFile, setSubmitFile] = useState(null)
  const [submitComment, setSubmitComment] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Review Form State
  const [reviewStatus, setReviewStatus] = useState('APPROVED')
  const [reviewCommentText, setReviewCommentText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Fetch Dashboard Summary
  useEffect(() => {
    loadSummary(activeView)
  }, [activeView])

  function loadSummary(viewToFetch) {
    setLoading(true)
    setError(null)
    getDashboardSummary(viewToFetch)
      .then(res => {
        setData(res)
        if (!activeView) {
          setActiveView(res.active_view)
        }
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err)
        const detail = err?.response?.data?.detail
        setError(typeof detail === 'string' ? detail : 'Unable to connect to WorkSync backend.')
      })
      .finally(() => setLoading(false))
  }

  // Fetch projects when opening create task modal
  useEffect(() => {
    if (createTaskOpen) {
      getProjects()
        .then(projs => {
          setAllProjects(projs || [])
          if (projs && projs.length > 0 && !taskProjectId) {
            setTaskProjectId(String(projs[0].id))
          }
        })
        .catch(() => setAllProjects([]))
    }
  }, [createTaskOpen])

  // Fetch team members when taskProjectId changes
  useEffect(() => {
    if (!taskProjectId || !allProjects.length) return
    const proj = allProjects.find(p => String(p.id) === String(taskProjectId))
    if (proj?.team_id) {
      getTeamMembers(proj.team_id)
        .then(m => {
          setProjectMembers(m || [])
          if (m && m.length > 0) {
            setTaskAssigneeId(String(m[0].user_id))
          } else {
            setTaskAssigneeId('')
          }
        })
        .catch(() => setProjectMembers([]))
    }
  }, [taskProjectId, allProjects])

  // Primary header button handler
  function handlePrimaryAction() {
    const currentView = data?.active_view || activeView
    if (currentView === 'member') {
      setSubmitWorkOpen(true)
    } else if (currentView === 'team_lead') {
      setCreateTaskOpen(true)
    } else if (currentView === 'manager') {
      navigate('/projects')
    } else {
      navigate('/team')
    }
  }

  // Quick action button dispatcher
  function handleQuickAction(actionType) {
    if (actionType === 'submit_work') {
      setSubmitWorkOpen(true)
    } else if (actionType === 'create_task') {
      setCreateTaskOpen(true)
    } else if (actionType === 'create_project') {
      navigate('/projects')
    } else if (actionType === 'review_queue') {
      // scroll to reviews or open
      const revEl = document.getElementById('pending-reviews-section')
      if (revEl) revEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Submit Create Task
  async function handleCreateTaskSubmit(e) {
    e.preventDefault()
    if (!taskTitle.trim() || !taskProjectId) return
    setTaskSubmitting(true)
    setTaskError('')

    try {
      await createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        project_id: parseInt(taskProjectId, 10),
        assigned_to: parseInt(taskAssigneeId, 10) || user.id,
        priority: taskPriority,
        due_date: taskDueDate || undefined,
      })
      setCreateTaskOpen(false)
      setTaskTitle('')
      setTaskDesc('')
      setTaskDueDate('')
      loadSummary(activeView)
    } catch (err) {
      console.error('Failed to create task:', err)
      const detail = err?.response?.data?.detail
      setTaskError(typeof detail === 'string' ? detail : 'Failed to create task.')
    } finally {
      setTaskSubmitting(false)
    }
  }

  // Submit Work on Task
  async function handleSubmitWork(e) {
    e.preventDefault()
    if (!submitTaskId || !submitFile) {
      setSubmitError('Please select a task and upload a deliverable file.')
      return
    }
    setSubmitLoading(true)
    setSubmitError('')

    const formData = new FormData()
    formData.append('file', submitFile)
    if (submitComment.trim()) {
      formData.append('comment', submitComment.trim())
    }

    try {
      await submitTaskWork(submitTaskId, formData)
      setSubmitWorkOpen(false)
      setSubmitFile(null)
      setSubmitComment('')
      loadSummary(activeView)
    } catch (err) {
      console.error('Failed to submit work:', err)
      const detail = err?.response?.data?.detail
      setSubmitError(typeof detail === 'string' ? detail : 'Failed to submit deliverable.')
    } finally {
      setSubmitLoading(false)
    }
  }

  // Open Review Modal
  function handleOpenReview(item) {
    setSelectedReviewItem(item)
    setReviewStatus('APPROVED')
    setReviewCommentText('')
    setReviewError('')
    setReviewModalOpen(true)
  }

  // Submit Review
  async function handleSubmitReview(e) {
    e.preventDefault()
    if (!selectedReviewItem) return
    setReviewLoading(true)
    setReviewError('')

    try {
      await reviewSubmission(selectedReviewItem.id, {
        status: reviewStatus,
        review_comment: reviewCommentText.trim() || undefined,
      })
      setReviewModalOpen(false)
      setSelectedReviewItem(null)
      loadSummary(activeView)
    } catch (err) {
      console.error('Failed to review submission:', err)
      const detail = err?.response?.data?.detail
      setReviewError(typeof detail === 'string' ? detail : 'Failed to submit review.')
    } finally {
      setReviewLoading(false)
    }
  }

  if (loading && !data) {
    return <LoadingState />
  }

  if (error && !data) {
    return <ErrorState error={error} onRetry={() => loadSummary(activeView)} />
  }

  const effectiveView = data?.active_view || 'member'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* 1. Header with greeting, role badge, date, view toggle, and primary action */}
      <DashboardHeader
        greeting={data.greeting}
        subtitle={data.subtitle}
        dateDisplay={data.date_display}
        role={data.role}
        activeView={effectiveView}
        allowedViews={data.allowed_views}
        onViewChange={v => {
          setActiveView(v)
        }}
        onPrimaryAction={handlePrimaryAction}
      />

      {/* 2. Quick Actions Bar */}
      <div style={{ marginBottom: '1.75rem' }}>
        <QuickActions
          activeView={effectiveView}
          onAction={handleQuickAction}
          onNavigate={navigate}
        />
      </div>

      {/* 3. Metric Cards Grid (4 responsive cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {data.metrics.map(m => (
          <MetricCard key={m.key} item={m} />
        ))}
      </div>

      {/* 4. Role-Specific Dashboard Content Layouts */}

      {/* A. MEMBER DASHBOARD */}
      {effectiveView === 'member' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <TaskStatusChart distribution={data.task_status_distribution} />
            <UpcomingDeadlines
              tasks={data.upcoming_deadlines}
              onOpenTask={() => navigate('/tasks')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <ProjectProgressCard
              projects={data.projects}
              onOpenProject={() => navigate('/projects')}
            />
            <RecentActivity activity={data.recent_activity} />
          </div>
        </div>
      )}

      {/* B. TEAM LEAD DASHBOARD */}
      {effectiveView === 'team_lead' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <TeamWorkload workload={data.team_workload} />
            <TaskStatusChart distribution={data.task_status_distribution} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <ProjectProgressCard
              projects={data.projects}
              onOpenProject={() => navigate('/projects')}
            />
            <div id="pending-reviews-section">
              <PendingReviews
                reviews={data.pending_reviews}
                onReviewSubmission={handleOpenReview}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <UpcomingDeadlines
              tasks={data.upcoming_deadlines}
              onOpenTask={() => navigate('/tasks')}
            />
            <RecentActivity activity={data.recent_activity} />
          </div>
        </div>
      )}

      {/* C. PROJECT MANAGER DASHBOARD */}
      {effectiveView === 'manager' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <ProjectProgressCard
              projects={data.projects}
              onOpenProject={() => navigate('/projects')}
            />
            <TaskStatusChart distribution={data.task_status_distribution} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <TeamWorkload workload={data.team_workload} />
            <div id="pending-reviews-section">
              <PendingReviews
                reviews={data.pending_reviews}
                onReviewSubmission={handleOpenReview}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <UpcomingDeadlines
              tasks={data.upcoming_deadlines}
              onOpenTask={() => navigate('/tasks')}
            />
            <RecentActivity activity={data.recent_activity} />
          </div>
        </div>
      )}

      {/* D. ADMIN DASHBOARD */}
      {effectiveView === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <PlatformOverview
              overview={data.platform_overview}
              onNavigate={navigate}
            />
            <TaskStatusChart distribution={data.task_status_distribution} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <ProjectProgressCard
              projects={data.projects}
              onOpenProject={() => navigate('/projects')}
            />
            <UpcomingDeadlines
              tasks={data.tasks}
              onOpenTask={() => navigate('/tasks')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            <PendingReviews
              reviews={data.pending_reviews}
              onReviewSubmission={handleOpenReview}
            />
            <RecentActivity activity={data.recent_activity} />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS
      ───────────────────────────────────────────────────────────── */}

      {/* 1. Create Task Modal */}
      {createTaskOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create New Task</h3>
              <button
                type="button"
                onClick={() => setCreateTaskOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            {taskError && (
              <div style={{ padding: '0.65rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement authentication middleware"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Project</label>
                <select
                  value={taskProjectId}
                  onChange={e => setTaskProjectId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                >
                  {allProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {projectMembers.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Assignee</label>
                  <select
                    value={taskAssigneeId}
                    onChange={e => setTaskAssigneeId(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    {projectMembers.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.user?.name || `User #${m.user_id}`}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCreateTaskOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid #d0c6d8', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', background: '#26C6DA', color: '#1A1A2E', cursor: 'pointer', fontWeight: 700 }}
                >
                  {taskSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Submit Work Modal */}
      {submitWorkOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Submit Deliverable</h3>
              <button
                type="button"
                onClick={() => setSubmitWorkOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            {submitError && (
              <div style={{ padding: '0.65rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitWork} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Select Task</label>
                <select
                  required
                  value={submitTaskId}
                  onChange={e => setSubmitTaskId(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                >
                  <option value="">-- Choose your assigned task --</option>
                  {(data.tasks || []).map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Deliverable File</label>
                <input
                  type="file"
                  required
                  onChange={e => setSubmitFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Comments / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Summary of changes, pull request link, or deliverable details..."
                  value={submitComment}
                  onChange={e => setSubmitComment(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSubmitWorkOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid #d0c6d8', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', background: '#26C6DA', color: '#1A1A2E', cursor: 'pointer', fontWeight: 700 }}
                >
                  {submitLoading ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Review Submission Modal */}
      {reviewModalOpen && selectedReviewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Review Deliverable</h3>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#1A1A2E' }}>{selectedReviewItem.task_title}</div>
              <div style={{ color: '#777184', marginTop: 2 }}>By: {selectedReviewItem.submitter_name}</div>
              {selectedReviewItem.comment && (
                <div style={{ color: '#334155', marginTop: 6, fontStyle: 'italic' }}>
                  "{selectedReviewItem.comment}"
                </div>
              )}
            </div>

            {reviewError && (
              <div style={{ padding: '0.65rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Decision</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={reviewStatus === 'APPROVED'}
                      onChange={() => setReviewStatus('APPROVED')}
                    />
                    Approve Deliverable
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="decision"
                      value="CHANGES_REQUESTED"
                      checked={reviewStatus === 'CHANGES_REQUESTED'}
                      onChange={() => setReviewStatus('CHANGES_REQUESTED')}
                    />
                    Request Changes
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Review Feedback / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Feedback on quality, tests, or changes requested..."
                  value={reviewCommentText}
                  onChange={e => setReviewCommentText(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1px solid #d0c6d8', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: 8,
                    border: 'none',
                    background: reviewStatus === 'APPROVED' ? '#10b981' : '#f59e0b',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {reviewLoading ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
