import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/common/AppShell'
import Dashboard from './pages/manager/Dashboard'

/* ── Placeholder pages for nav items not yet implemented ─────────── */
const PAGE_CONTENT = {
  projects: { title: 'Projects',  description: 'Create, organise, and track your team projects.' },
  tasks:    { title: 'Tasks',     description: 'Manage your tasks and track their progress.' },
  team:     { title: 'Team',      description: 'View and manage your team members.' },
  settings: { title: 'Settings',  description: 'Manage your account and preferences.' },
}

function PlaceholderPage({ title, description }) {
  return (
    <section>
      <h1 className="page-title">{title}</h1>
      <p className="body-text" style={{ marginTop: 'var(--space-2)' }}>{description}</p>
    </section>
  )
}

/* ── Inner app — has access to AuthContext ──────────────────────── */
function AppInner() {
  const [activePage, setActivePage] = useState('dashboard')
  const { user, role, loading } = useAuth()

  // While checking the session show nothing (AppShell handles its own skeleton)
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--surface-page)',
      }}>
        <span className="spinner spinner-lg" aria-label="Loading…" />
      </div>
    )
  }

  // Determine greeting name: authenticated user's name, or a fallback for demo
  const userName = user?.name ?? 'there'
  // Normalise role to lowercase for ROLE_CONFIG keys in Dashboard
  const dashboardRole = role ? role.toLowerCase() : 'manager'

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' ? (
        <Dashboard role={dashboardRole} user={{ name: userName }} />
      ) : (
        <PlaceholderPage {...PAGE_CONTENT[activePage]} />
      )}
    </AppShell>
  )
}

/* ── Root export — wraps everything in AuthProvider ─────────────── */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
