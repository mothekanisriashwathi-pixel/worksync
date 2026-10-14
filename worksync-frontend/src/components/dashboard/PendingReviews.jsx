import { IconCheck, IconWarning } from '../common/WorkSyncIcons'

export default function PendingReviews({ reviews = [], onReviewSubmission }) {
  if (reviews.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          padding: '2rem 1.5rem',
          border: '1px solid #E9E3EE',
          textAlign: 'center',
          color: '#777184',
        }}
      >
        <IconCheck size={36} style={{ color: '#10b981', marginBottom: '0.75rem' }} />
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#1A1A2E', fontSize: '1rem' }}>Review Queue Clear</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>No pending submissions waiting for approval.</p>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: '1.4rem 1.5rem',
        border: '1px solid #E9E3EE',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1A1A2E' }}>
            Pending Reviews & Approvals
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
            Deliverables submitted by team members requiring sign-off
          </p>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: '#b45309',
          }}
        >
          {reviews.length} Action{reviews.length !== 1 ? 's' : ''} Needed
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {reviews.map(item => (
          <div
            key={item.id}
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 10,
              border: '1px solid #fef3c7',
              backgroundColor: '#fffdfa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A1A2E' }}>
                {item.task_title}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#777184', marginTop: 2 }}>
                Submitted by <strong style={{ color: '#4e4059' }}>{item.submitter_name}</strong>
                {item.project_name ? ` on ${item.project_name}` : ''}
              </div>
              {item.comment && (
                <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: 4, fontStyle: 'italic' }}>
                  "{item.comment}"
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onReviewSubmission?.(item)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#26C6DA',
                color: '#1A1A2E',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Review
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
