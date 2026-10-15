import { useEffect, useRef } from 'react'
import { IconClose, IconInbox } from '../common/WorkSyncIcons'
import { priorityMeta, statusLabel } from '../../lib/ui'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Escape closes, Tab stays inside, focus returns to the opener on close. */
function useModalFocus(ref, onClose) {
  // Callers pass inline handlers; keep the latest in a ref so the effect runs once per open.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const opener = document.activeElement
    const node = ref.current
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE)
    first?.focus()

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [ref])
}

export function Dialog({ title, onClose, children, footer, width = 480 }) {
  const ref = useRef(null)
  useModalFocus(ref, onClose)
  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" style={{ maxWidth: width }}>
        <div className="dialog-head">
          <h2 id="dialog-title" className="dialog-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, onClose, children, actions }) {
  const ref = useRef(null)
  useModalFocus(ref, onClose)
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>{actions}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close panel">
            <IconClose size={16} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  )
}

export function StatusPill({ status }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', fontSize: 12.5 }}>
      <span className="status-dot" data-status={status} aria-hidden="true" />
      {statusLabel(status)}
    </span>
  )
}

export function PriorityTag({ priority, showLabel = true }) {
  const meta = priorityMeta(priority)
  return (
    <span
      className={priority === 'URGENT' ? 'priority-urgent' : 'cell-muted'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
      title={`${meta.label} priority`}
    >
      {priority === 'URGENT'
        ? <span aria-hidden="true" style={{ fontWeight: 800, width: 11, textAlign: 'center' }}>!</span>
        : <span className="priority-bars" data-level={meta.level} aria-hidden="true"><i /><i /><i /></span>}
      {showLabel ? meta.label : <span className="sr-only">{meta.label} priority</span>}
    </span>
  )
}

export function ProgressBar({ value, label }) {
  if (value === null || value === undefined) {
    return <span className="faint" style={{ fontSize: 12.5 }}>No tasks yet</span>
  }
  const tone = value === 100 ? 'success' : undefined
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <div className="progress" data-tone={tone} style={{ flex: 1, minWidth: 48 }} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Progress'}>
        <span style={{ width: `${value}%` }} />
      </div>
      <span className="mono faint" style={{ width: 34, textAlign: 'right' }}>{value}%</span>
    </div>
  )
}

export function EmptyState({ icon: Icon = IconInbox, title, children, action }) {
  return (
    <div className="empty">
      <Icon size={28} />
      {title && <strong>{title}</strong>}
      {children && <div style={{ maxWidth: 380 }}>{children}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

export function Skeleton({ rows = 5, height = 18 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" style={{ height, width: `${92 - (i % 3) * 14}%` }} />
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading' }) {
  return <span className="spinner spinner-sm" role="status" aria-label={label} />
}
