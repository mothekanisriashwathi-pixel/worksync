export default function RecentActivity({ activity = [] }) {
  if (activity.length === 0) {
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
        <h4 style={{ margin: '0 0 0.35rem 0', color: '#1A1A2E', fontSize: '1rem' }}>No Recent Activity</h4>
        <p style={{ margin: 0, fontSize: '0.85rem' }}>System events and updates will be logged here.</p>
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
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#1A1A2E' }}>
          Recent Activity & Audit
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#777184' }}>
          Chronological record of team collaboration
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {activity.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              fontSize: '0.825rem',
              lineHeight: 1.45,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(38, 198, 218, 0.15)',
                color: '#0097a7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.7rem',
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {item.actor ? item.actor[0].toUpperCase() : 'W'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#1A1A2E' }}>
                <strong style={{ fontWeight: 700 }}>{item.actor}</strong>{' '}
                <span style={{ color: '#777184' }}>{item.action}</span>{' '}
                <span style={{ fontWeight: 600, color: '#2E3A4B' }}>{item.target}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9E8FAA', marginTop: 2 }}>
                {item.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
