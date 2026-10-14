import { useState, useEffect } from 'react'
import { getTeams, getTeamMembers, addTeamMember, removeTeamMember, createTeam } from '../../api/teamsApi'
import { getUsers } from '../../api/usersApi'
import { useAuth } from '../../context/AuthContext'
import { IconAdd, IconClose, IconTeam } from '../../components/common/WorkSyncIcons'

export default function TeamPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [activeTeamId, setActiveTeamId] = useState(null)
  const [members, setMembers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  // Modals
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (activeTeamId) {
      loadTeamMembers(activeTeamId)
    }
  }, [activeTeamId])

  async function loadTeams() {
    setLoading(true)
    setPageError('')
    try {
      const [teamsData, usersData] = await Promise.all([
        getTeams().catch(() => []),
        getUsers().catch(() => []),
      ])
      setTeams(teamsData || [])
      setAllUsers(usersData || [])
      if (teamsData && teamsData.length > 0) {
        setActiveTeamId(teamsData[0].id)
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
      setPageError('Failed to load team information.')
    } finally {
      setLoading(false)
    }
  }

  async function loadTeamMembers(teamId) {
    try {
      const data = await getTeamMembers(teamId)
      setMembers(data || [])
    } catch (err) {
      console.error('Failed to load members for team:', err)
      setMembers([])
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!selectedUserId || !activeTeamId) return
    setSubmitting(true)
    setModalError('')

    try {
      await addTeamMember(activeTeamId, { user_id: parseInt(selectedUserId, 10) })
      await loadTeamMembers(activeTeamId)
      setMemberModalOpen(false)
      setSelectedUserId('')
    } catch (err) {
      console.error('Failed to add team member:', err)
      const detail = err?.response?.data?.detail
      setModalError(typeof detail === 'string' ? detail : 'Failed to add member to team.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm('Are you sure you want to remove this user from the team?')) return
    try {
      await removeTeamMember(activeTeamId, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (err) {
      console.error('Failed to remove member:', err)
      const detail = err?.response?.data?.detail
      alert(typeof detail === 'string' ? detail : 'Failed to remove member.')
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setSubmitting(true)
    setModalError('')

    try {
      const created = await createTeam({
        name: newTeamName.trim(),
        description: newTeamDesc.trim() || undefined,
      })
      setTeams(prev => [...prev, created])
      setActiveTeamId(created.id)
      setTeamModalOpen(false)
      setNewTeamName('')
      setNewTeamDesc('')
    } catch (err) {
      console.error('Failed to create team:', err)
      const detail = err?.response?.data?.detail
      setModalError(typeof detail === 'string' ? detail : 'Failed to create team.')
    } finally {
      setSubmitting(false)
    }
  }

  const activeTeam = teams.find(t => t.id === activeTeamId)
  const existingMemberIds = new Set(members.map(m => m.user_id))
  const availableUsers = allUsers.filter(u => !existingMemberIds.has(u.id))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1A1A2E', margin: '0 0 0.35rem 0' }}>
            Team Management
          </h1>
          <p style={{ margin: 0, color: '#777184', fontSize: '0.95rem' }}>
            Collaborators, roles, and workspace access management
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              type="button"
              onClick={() => {
                setModalError('')
                setTeamModalOpen(true)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: 8,
                backgroundColor: '#f1f5f9',
                color: '#1A1A2E',
                fontWeight: 600,
                border: '1px solid #d0c6d8',
                cursor: 'pointer',
              }}
            >
              <IconAdd size={16} />
              New Team
            </button>
          )}

          <button
            type="button"
            disabled={!activeTeamId}
            onClick={() => {
              setModalError('')
              if (availableUsers.length > 0) {
                setSelectedUserId(String(availableUsers[0].id))
              }
              setMemberModalOpen(true)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem',
              borderRadius: 8,
              backgroundColor: !activeTeamId ? '#d0c6d8' : '#26C6DA',
              color: '#1A1A2E',
              fontWeight: 700,
              border: 'none',
              cursor: !activeTeamId ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(38, 198, 218, 0.3)',
            }}
          >
            <IconAdd size={18} />
            Add Member
          </button>
        </div>
      </div>

      {pageError && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.9rem' }}>
          {pageError}
        </div>
      )}

      {/* Team Tabs if multiple teams exist */}
      {teams.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid #ede8f5', paddingBottom: '0.5rem' }}>
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTeamId(t.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 6,
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTeamId === t.id ? '#26C6DA' : '#f1f5f9',
                color: activeTeamId === t.id ? '#1A1A2E' : '#475569',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {activeTeam && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #E9E3EE' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#1A1A2E' }}>
            {activeTeam.name}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#777184' }}>
            {activeTeam.description || 'Active workspace team.'}
          </p>
        </div>
      )}

      {/* Team Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#777184' }}>
          <span className="spinner spinner-lg" style={{ display: 'inline-block', marginBottom: '1rem' }} />
          <div>Loading team members...</div>
        </div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E9E3EE' }}>
          <IconTeam size={48} style={{ color: '#9E8FAA', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1A1A2E' }}>No Teams Configured</h3>
          <p style={{ color: '#777184', margin: '0 0 1.25rem 0' }}>
            Create a team to start collaborating and assigning tasks.
          </p>
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => setTeamModalOpen(true)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8, backgroundColor: '#26C6DA', color: '#1A1A2E', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Create Team
            </button>
          )}
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #E9E3EE' }}>
          <IconTeam size={48} style={{ color: '#9E8FAA', marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1A1A2E' }}>No Members in this Team</h3>
          <p style={{ color: '#777184', margin: '0 0 1.25rem 0' }}>
            Add members from your workspace so they can receive tasks.
          </p>
          <button
            onClick={() => {
              setModalError('')
              if (availableUsers.length > 0) {
                setSelectedUserId(String(availableUsers[0].id))
              }
              setMemberModalOpen(true)
            }}
            style={{ padding: '0.6rem 1.25rem', borderRadius: 8, backgroundColor: '#26C6DA', color: '#1A1A2E', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Add First Member
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {members.map(member => {
            const memberName = member.user?.name || `User #${member.user_id}`
            const memberEmail = member.user?.email || '—'
            const memberRole = member.user?.role || 'MEMBER'
            const initials = memberName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            return (
              <div
                key={member.user_id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 12,
                  border: '1px solid #E9E3EE',
                  padding: '1.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(38, 198, 218, 0.15)',
                      color: '#26C6DA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                    }}>
                      {initials}
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: memberRole === 'ADMIN' ? '#fee2e2' : memberRole === 'MANAGER' ? 'rgba(38, 198, 218, 0.15)' : '#f0fdf4',
                      color: memberRole === 'ADMIN' ? '#b91c1c' : memberRole === 'MANAGER' ? '#0097a7' : '#15803d',
                    }}>
                      {memberRole}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1A1A2E' }}>
                    {memberName}
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#777184' }}>
                    {memberEmail}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f5f0f0', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>● Active</span>
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9E8FAA',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {memberModalOpen && (
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
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Add Member to Team</h3>
              <button onClick={() => setMemberModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}>
                <IconClose size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.65rem 0.85rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Select User</label>
                {availableUsers.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#b91c1c', padding: '0.5rem', backgroundColor: '#fef2f2', borderRadius: 6 }}>
                    No other users available to add. All active accounts are already in this team.
                  </div>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', backgroundColor: '#fff' }}
                  >
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({u.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: '1px solid #d0c6d8', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableUsers.length === 0}
                  style={{
                    padding: '0.65rem 1.4rem',
                    borderRadius: 8,
                    border: 'none',
                    background: availableUsers.length === 0 ? '#d0c6d8' : '#26C6DA',
                    color: '#1A1A2E',
                    cursor: availableUsers.length === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {teamModalOpen && (
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
          <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '2rem', maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Create New Team</h3>
              <button onClick={() => setTeamModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#777184' }}>
                <IconClose size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '0.65rem 0.85rem', marginBottom: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 8, fontSize: '0.85rem' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineering"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose and team scope..."
                  value={newTeamDesc}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 8, border: '1px solid #d0c6d8', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(false)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: '1px solid #d0c6d8', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.65rem 1.4rem', borderRadius: 8, border: 'none', background: '#26C6DA', color: '#1A1A2E', cursor: 'pointer', fontWeight: 700 }}
                >
                  {submitting ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
