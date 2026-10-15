import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppShell from './components/common/AppShell'
import { Skeleton } from './components/ui/Primitives'

// Route-level code splitting keeps each page (and the auth-page Aurora effect) out of the initial bundle.
const LandingPage = lazy(() => import('./pages/landing/LandingPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const Dashboard = lazy(() => import('./pages/manager/Dashboard'))
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'))
const ProjectWorkspacePage = lazy(() => import('./pages/projects/ProjectWorkspacePage'))
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'))
const SubmissionsPage = lazy(() => import('./pages/submissions/SubmissionsPage'))
const TeamPage = lazy(() => import('./pages/team/TeamPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))

function LoadingScreen() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--surface-page)' }}>
      <span className="spinner spinner-lg" role="status" aria-label="Loading" />
    </div>
  )
}

/** One persistent shell for every signed-in page; only the outlet changes on navigation. */
function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Suspense fallback={<Skeleton rows={6} />}><Outlet /></Suspense>
    </AppShell>
  )
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppInner() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectWorkspacePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  )
}
