import TaskWorkspace from '../../components/tasks/TaskWorkspace'
import { useAuth } from '../../context/AuthContext'
import { useWorkspaceData } from '../../lib/useWorkspaceData'
import { canManageRole, isOverdue } from '../../lib/ui'

export default function TasksPage() {
  const { role } = useAuth()
  const data = useWorkspaceData()
  const open = data.tasks.filter(t => t.status !== 'COMPLETED').length
  const overdue = data.tasks.filter(isOverdue).length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            {data.loading
              ? 'Loading tasks…'
              : `${open} open${overdue ? ` · ${overdue} overdue` : ''} · ${canManageRole(role) ? 'across projects you manage' : 'across your teams'}`}
          </p>
        </div>
      </div>
      <TaskWorkspace data={data} />
    </div>
  )
}
