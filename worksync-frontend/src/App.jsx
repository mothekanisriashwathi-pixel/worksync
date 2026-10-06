import { useState } from 'react'
import AppShell from './components/common/AppShell'
import Dashboard from './pages/manager/Dashboard'

/**
 * App.jsx — root component.
 *
 * Currently renders the AppShell + Dashboard for design system validation.
 * Routing, authentication, and role-based page switching will be added
 * in Phase 3 (Authentication) using react-router-dom.
 */

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      <Dashboard />
    </AppShell>
  )
}
