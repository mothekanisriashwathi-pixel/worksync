import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../../api/projectsApi'
import { getTasks } from '../../api/tasksApi'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { canManageRole, statusLabel } from '../../lib/ui'
import { NAV_GROUPS } from './Sidebar'
import {
  IconSearch, IconAdd, IconSun, IconMoon, IconNotifications, IconProjects, IconTasks, IconCornerDownLeft,
} from './WorkSyncIcons'

const MAX_PER_GROUP = 8

/**
 * Global command palette (Ctrl/Cmd+K). Searches only data the backend already
 * returns to this user (GET /projects, GET /tasks are permission-scoped), and
 * only lists create actions for roles the backend allows to create.
 */
export default function CommandPalette({ onClose }) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [data, setData] = useState({ projects: [], tasks: [], loading: true, error: false })
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    const opener = document.activeElement
    inputRef.current?.focus()
    let alive = true
    Promise.all([getProjects(), getTasks()])
      .then(([projects, tasks]) => alive && setData({ projects: projects || [], tasks: tasks || [], loading: false, error: false }))
      .catch(() => alive && setData(d => ({ ...d, loading: false, error: true })))
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      alive = false
      document.body.style.overflow = prev
      opener?.focus?.()
    }
  }, [])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (...fields) => !q || fields.some(f => f && String(f).toLowerCase().includes(q))
    const go = path => () => navigate(path)

    const nav = NAV_GROUPS.flatMap(g => g.items)
      .filter(i => match(i.label, `go to ${i.label}`))
      .map(i => ({ id: `nav-${i.key}`, label: `Go to ${i.label}`, Icon: i.Icon, hint: `G ${i.shortcut.toUpperCase()}`, run: go(`/${i.key}`) }))

    const actions = [
      canManageRole(role) && { id: 'new-project', label: 'Create project', Icon: IconAdd, run: go('/projects?new=1'), keywords: 'new add' },
      canManageRole(role) && { id: 'new-task', label: 'Create task', Icon: IconAdd, run: go('/tasks?new=1'), keywords: 'new add' },
      { id: 'theme', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', Icon: theme === 'dark' ? IconSun : IconMoon, run: toggleTheme, keywords: 'theme dark light appearance' },
      { id: 'notifications', label: 'Open notifications', Icon: IconNotifications, run: () => window.dispatchEvent(new Event('ws:open-notifications')), keywords: 'inbox alerts' },
    ].filter(Boolean).filter(a => match(a.label, a.keywords))

    const projects = q
      ? data.projects.filter(p => match(p.name, p.description)).slice(0, MAX_PER_GROUP).map(p => ({
        id: `project-${p.id}`, label: p.name, Icon: IconProjects, hint: 'Project', run: go(`/projects/${p.id}`),
      }))
      : []

    const tasks = q
      ? data.tasks.filter(t => match(t.title, t.description)).slice(0, MAX_PER_GROUP).map(t => ({
        id: `task-${t.id}`, label: t.title, Icon: IconTasks, hint: statusLabel(t.status), run: go(`/tasks?task=${t.id}`),
      }))
      : []

    return [
      { title: 'Navigation', items: nav },
      { title: 'Actions', items: actions },
      { title: 'Projects', items: projects },
      { title: 'Tasks', items: tasks },
    ].filter(g => g.items.length)
  }, [query, data, role, theme, navigate, toggleTheme])

  const flat = groups.flatMap(g => g.items)
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0))

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function run(item) {
    onClose()
    item.run()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((activeIndex + 1) % Math.max(flat.length, 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((activeIndex - 1 + flat.length) % Math.max(flat.length, 1)) }
    else if (e.key === 'Enter' && flat[activeIndex]) { e.preventDefault(); run(flat[activeIndex]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'Tab') e.preventDefault() // focus stays in the palette
  }

  let index = -1
  return (
    <div className="overlay palette-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-input">
          <IconSearch size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKeyDown}
            placeholder="Search projects and tasks, or type a command…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={flat[activeIndex] ? `pal-${flat[activeIndex].id}` : undefined}
            aria-autocomplete="list"
            spellCheck={false}
          />
          {data.loading && <span className="spinner spinner-sm" aria-label="Loading results" />}
        </div>
        <div className="palette-list" id="palette-list" role="listbox" ref={listRef} aria-label="Results">
          {groups.map(g => (
            <div key={g.title} role="group" aria-label={g.title}>
              <div className="palette-group" aria-hidden="true">{g.title}</div>
              {g.items.map(item => {
                index += 1
                const selected = index === activeIndex
                const myIndex = index
                return (
                  <div
                    key={item.id}
                    id={`pal-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    className="palette-item"
                    onMouseMove={() => !selected && setActive(myIndex)}
                    onClick={() => run(item)}
                  >
                    <item.Icon size={16} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {item.hint && <span className="hint">{item.hint}</span>}
                  </div>
                )
              })}
            </div>
          ))}
          {!flat.length && (
            <div className="empty" style={{ padding: 28 }}>
              {data.error ? 'Could not load projects and tasks.' : `No results for “${query}”`}
            </div>
          )}
        </div>
        <div className="palette-foot" aria-hidden="true">
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd><IconCornerDownLeft size={10} /></kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
