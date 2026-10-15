import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconCheck } from './WorkSyncIcons'

// WebGL effect is split into its own chunk and only fetched for the auth/landing brand panels.
const Aurora = lazy(() => import('../reactbits/Aurora'))

// eslint-disable-next-line react-refresh/only-export-components
export function useAmbientMotion() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const wide = window.matchMedia?.('(min-width: 900px)')
    const update = () => setOk(!reduce?.matches && Boolean(wide?.matches))
    update()
    reduce?.addEventListener?.('change', update)
    wide?.addEventListener?.('change', update)
    return () => {
      reduce?.removeEventListener?.('change', update)
      wide?.removeEventListener?.('change', update)
    }
  }, [])
  return ok
}

export function AuroraBackdrop({ opacity = 0.5 }) {
  const animate = useAmbientMotion()
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Static gradient: shown under reduced motion, on small screens, or before WebGL loads */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 70% at 20% 0%, rgba(34,211,238,0.22), transparent 60%), radial-gradient(90% 60% at 90% 10%, rgba(124,58,237,0.2), transparent 60%)' }} />
      {animate && (
        <Suspense fallback={null}>
          <Aurora colorStops={['#0e7490', '#22d3ee', '#6d28d9']} amplitude={0.9} blend={0.55} speed={0.45} mouseInteraction={false} opacity={opacity} />
        </Suspense>
      )}
    </div>
  )
}

const POINTS = [
  'Projects, tasks and deadlines in one workspace',
  'Submissions with versioned reviews and feedback',
  'Linked GitHub repositories and recent commits',
]

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', background: 'var(--surface-page)' }}>
      <aside style={{ position: 'relative', background: '#080b12', color: '#e7ecf3', padding: 'clamp(28px, 5vw, 56px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32, overflow: 'hidden', minHeight: 260 }}>
        <AuroraBackdrop />
        <Link to="/" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10, color: '#f2f5fa' }}>
          <span className="sidebar-logo-mark" aria-hidden="true">W</span>
          <span className="sidebar-logo-text">WorkSync</span>
        </Link>
        <div style={{ position: 'relative', maxWidth: 440 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.03em', color: '#f2f5fa', margin: '0 0 18px' }}>
            Where student and company teams ship work together.
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {POINTS.map(p => (
              <li key={p} style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#a3acbb', fontSize: 14 }}>
                <IconCheck size={15} style={{ color: '#22d3ee', flexShrink: 0 }} /> {p}
              </li>
            ))}
          </ul>
        </div>
        <span style={{ position: 'relative', fontSize: 12, color: '#5b6578' }}>Background effect: Aurora by React Bits</span>
      </aside>

      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px, 5vw, 56px) 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="page-enter">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle" style={{ marginBottom: 24 }}>{subtitle}</p>}
          {children}
          {footer && <div style={{ marginTop: 20, fontSize: 13.5, color: 'var(--text-secondary)' }}>{footer}</div>}
        </div>
      </main>
    </div>
  )
}
