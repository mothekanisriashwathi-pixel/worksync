import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/common/AppShell'
import Dashboard from './pages/manager/Dashboard'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import TasksPage from './pages/tasks/TasksPage'
import TeamPage from './pages/team/TeamPage'
import SettingsPage from './pages/settings/SettingsPage'

/* ── Loading spinner ──────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--surface-page)',
    }}>
      <span className="spinner spinner-lg" aria-label="Loading…" />
    </div>
  )
}

/* ── Route guards ─────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

/* ── Inner app — has access to AuthContext ──────────────────── */
function AppInner() {
  const { user, role } = useAuth()

  const userName = user?.name ?? 'there'
  const dashboardRole = role ? role.toLowerCase() : 'manager'

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
      } />
      <Route path="/register" element={
        <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
      } />

      {/* Protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppShell>
            <Dashboard role={dashboardRole} user={{ name: userName }} />
          </AppShell>
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <AppShell><ProjectsPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          <AppShell><TasksPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/team" element={
        <ProtectedRoute>
          <AppShell><TeamPage /></AppShell>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppShell><SettingsPage /></AppShell>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/* ── Root export — wraps everything in AuthProvider ─────────── */
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
