export function LoadingState() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ width: 280, height: 32, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 }} />
        <div style={{ width: 420, height: 16, backgroundColor: '#f1f5f9', borderRadius: 6 }} />
      </div>

      {/* Metric Cards Skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 14,
              padding: '1.5rem',
              border: '1px solid #E9E3EE',
              height: 100,
            }}
          >
            <div style={{ width: '60%', height: 14, backgroundColor: '#f1f5f9', borderRadius: 4, marginBottom: 16 }} />
            <div style={{ width: '30%', height: 28, backgroundColor: '#e2e8f0', borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Main Skeleton Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 14, height: 300, border: '1px solid #E9E3EE' }} />
        <div style={{ backgroundColor: '#ffffff', borderRadius: 14, height: 300, border: '1px solid #E9E3EE' }} />
      </div>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: '4rem auto',
        padding: '2.5rem',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        border: '1px solid #fecaca',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto 1.25rem auto',
        }}
      >
        ⚠️
      </div>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#1A1A2E', fontSize: '1.2rem', fontWeight: 800 }}>
        Unable to Load Dashboard
      </h3>
      <p style={{ margin: '0 0 1.5rem 0', color: '#777184', fontSize: '0.9rem', lineHeight: 1.5 }}>
        {error || 'An unexpected error occurred while communicating with the WorkSync backend.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '0.65rem 1.4rem',
            borderRadius: 8,
            backgroundColor: '#26C6DA',
            color: '#1A1A2E',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}
