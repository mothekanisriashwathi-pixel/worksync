import { useCallback, useEffect, useState } from 'react'
import { getProjects } from '../api/projectsApi'
import { getTasks } from '../api/tasksApi'
import { getTeams, getTeamMembers } from '../api/teamsApi'
import { getUsers } from '../api/usersApi'
import { useAuth } from '../context/AuthContext'
import { canManageRole, errorText } from './ui'

/**
 * Projects, tasks, teams and a user-name directory, all from permission-scoped
 * endpoints. Admins/managers may list users; members only see their own teams'
 * rosters, so names are built from those instead.
 */
export function useWorkspaceData() {
  const { user, role } = useAuth()
  const [state, setState] = useState({
    projects: [], tasks: [], teams: [], users: new Map(), loading: true, error: '',
  })

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: '' }))
    try {
      const [projects, tasks, teams] = await Promise.all([getProjects(), getTasks(), getTeams()])
      const users = new Map()
      if (user) users.set(user.id, user)
      if (canManageRole(role)) {
        ;(await getUsers().catch(() => [])).forEach(u => users.set(u.id, u))
      } else {
        const rosters = await Promise.all((teams || []).map(t => getTeamMembers(t.id).catch(() => [])))
        rosters.flat().forEach(m => m.user && users.set(m.user_id, m.user))
      }
      setState({ projects: projects || [], tasks: tasks || [], teams: teams || [], users, loading: false, error: '' })
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: errorText(err, 'Could not load workspace data.') }))
    }
  }, [user, role])

  useEffect(() => { load() }, [load])

  const setTasks = useCallback(fn => setState(s => ({ ...s, tasks: typeof fn === 'function' ? fn(s.tasks) : fn })), [])
  const setProjects = useCallback(fn => setState(s => ({ ...s, projects: typeof fn === 'function' ? fn(s.projects) : fn })), [])

  return { ...state, reload: load, setTasks, setProjects }
}

export const userName = (users, id) => users.get(id)?.name ?? `User #${id}`
