import { Link } from 'react-router-dom'
import {
  IconDashboard,
  IconProjects,
  IconTasks,
  IconTeam,
  IconNotifications,
  IconCheck,
} from '../../components/common/WorkSyncIcons'

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1A1A2E',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* ── Navigation ────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(26, 26, 46, 0.85)',
        borderBottom: '1px solid #2E3A4B',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #26C6DA 0%, #2E3A4B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1A1A2E',
            fontWeight: 800,
            fontSize: '1.35rem',
            boxShadow: '0 4px 14px rgba(38, 198, 218, 0.35)',
          }}>
            W
          </div>
          <span style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #26C6DA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            WorkSync
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/login"
            style={{
              padding: '0.6rem 1.35rem',
              borderRadius: '8px',
              fontSize: '0.925rem',
              fontWeight: 700,
              color: '#B0BEC5',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              border: '1px solid #2E3A4B',
            }}
          >
            Sign In
          </Link>

          <Link
            to="/register"
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.925rem',
              fontWeight: 700,
              color: '#1A1A2E',
              backgroundColor: '#26C6DA',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(38, 198, 218, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '4rem 1.5rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 4rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(38, 198, 218, 0.12)',
            border: '1px solid rgba(38, 198, 218, 0.3)',
            color: '#26C6DA',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: '1rem' }}>⚡</span>
            <span>FinTech Midnight Edition • Space Grotesk Architecture</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.75rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            color: '#ffffff',
          }}>
            Sync Your Teams.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #26C6DA 0%, #80deea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Ship Projects Faster.
            </span>
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: '#B0BEC5',
            lineHeight: 1.6,
            marginBottom: '2.5rem',
            maxWidth: 680,
            margin: '0 auto 2.5rem auto',
          }}>
            WorkSync unites tasks, team roadmaps, real-time reviews, and role permissions in a high-speed workspace built for scale.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 2rem',
                borderRadius: '10px',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#1A1A2E',
                backgroundColor: '#26C6DA',
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(38, 198, 218, 0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              Start Free Trial →
            </Link>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 2rem',
                borderRadius: '10px',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#2E3A4B',
                border: '1px solid #3d4c60',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* ── Interactive Preview Card ─────────────────────────── */}
        <div style={{
          backgroundColor: '#2E3A4B',
          borderRadius: '16px',
          border: '1px solid #3d4c60',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(38, 198, 218, 0.1)',
          overflow: 'hidden',
          marginBottom: '4.5rem',
        }}>
          <div style={{
            backgroundColor: '#1A1A2E',
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid #3d4c60',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#26C6DA' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: '#B0BEC5', fontWeight: 600 }}>
              WorkSync Workspace Preview • FinTech Midnight Active
            </span>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ padding: '2.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem' }}>
            <div style={{
              backgroundColor: '#1A1A2E',
              padding: '1.65rem',
              borderRadius: '12px',
              border: '1px solid #3d4c60',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(38, 198, 218, 0.15)', color: '#26C6DA' }}>
                  <IconProjects size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>FinTech Core Platform</h4>
                  <span style={{ fontSize: '0.8rem', color: '#B0BEC5' }}>Enterprise Architecture</span>
                </div>
              </div>
              <div style={{ marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#B0BEC5' }}>Progress</span>
                <span style={{ fontWeight: 700, color: '#26C6DA' }}>84%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, backgroundColor: '#2E3A4B', overflow: 'hidden' }}>
                <div style={{ width: '84%', height: '100%', backgroundColor: '#26C6DA', boxShadow: '0 0 10px #26C6DA' }} />
              </div>
            </div>

            <div style={{
              backgroundColor: '#1A1A2E',
              padding: '1.65rem',
              borderRadius: '12px',
              border: '1px solid #3d4c60',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(38, 198, 218, 0.15)', color: '#26C6DA' }}>
                  <IconTasks size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Sprint Workflows</h4>
                  <span style={{ fontSize: '0.8rem', color: '#B0BEC5' }}>18 Active • 0 Overdue</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ padding: '4px 10px', borderRadius: 4, backgroundColor: 'rgba(38, 198, 218, 0.15)', color: '#26C6DA', fontSize: '0.8rem', fontWeight: 700 }}>
                  ✓ 12 Completed
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 4, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>
                  ⏳ 6 In Review
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#1A1A2E',
              padding: '1.65rem',
              borderRadius: '12px',
              border: '1px solid #3d4c60',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(38, 198, 218, 0.15)', color: '#26C6DA' }}>
                  <IconTeam size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Role Access Control</h4>
                  <span style={{ fontSize: '0.8rem', color: '#B0BEC5' }}>Admin • Project Lead • Person</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#B0BEC5', lineHeight: 1.5 }}>
                Three distinct access personas configured out of the box with JWT sessions.
              </p>
            </div>
          </div>
        </div>

        {/* ── Feature Highlights Grid ─────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '4.5rem',
        }}>
          <div style={{
            padding: '1.75rem',
            backgroundColor: '#2E3A4B',
            borderRadius: '14px',
            border: '1px solid #3d4c60',
          }}>
            <div style={{ color: '#26C6DA', marginBottom: '1rem' }}>
              <IconDashboard size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Unified Dashboard</h3>
            <p style={{ fontSize: '0.925rem', color: '#B0BEC5', lineHeight: 1.5 }}>
              Centralized view of project completion percentages, task distribution donut charts, and live activity.
            </p>
          </div>

          <div style={{
            padding: '1.75rem',
            backgroundColor: '#2E3A4B',
            borderRadius: '14px',
            border: '1px solid #3d4c60',
          }}>
            <div style={{ color: '#26C6DA', marginBottom: '1rem' }}>
              <IconTasks size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Kanban Management</h3>
            <p style={{ fontSize: '0.925rem', color: '#B0BEC5', lineHeight: 1.5 }}>
              Dynamic column boards across To Do, In Progress, In Review, and Completed with instant status switching.
            </p>
          </div>

          <div style={{
            padding: '1.75rem',
            backgroundColor: '#2E3A4B',
            borderRadius: '14px',
            border: '1px solid #3d4c60',
          }}>
            <div style={{ color: '#26C6DA', marginBottom: '1rem' }}>
              <IconNotifications size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Live Notifications</h3>
            <p style={{ fontSize: '0.925rem', color: '#B0BEC5', lineHeight: 1.5 }}>
              Automated notifications for task assignments, submissions, approvals, and team milestone updates.
            </p>
          </div>

          <div style={{
            padding: '1.75rem',
            backgroundColor: '#2E3A4B',
            borderRadius: '14px',
            border: '1px solid #3d4c60',
          }}>
            <div style={{ color: '#26C6DA', marginBottom: '1rem' }}>
              <IconCheck size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Enterprise Security</h3>
            <p style={{ fontSize: '0.925rem', color: '#B0BEC5', lineHeight: 1.5 }}>
              HTTP-only cookie exchange, bcrypt password hashing, CORS protection, and SQLite/MySQL backends.
            </p>
          </div>
        </div>

        {/* ── Call To Action Banner ────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #2E3A4B 0%, #1A1A2E 100%)',
          borderRadius: '16px',
          border: '1px solid #3d4c60',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
        }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
            Elevate Your Team's Productivity Today
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#B0BEC5', maxWidth: 620, margin: '0 auto 2.25rem auto' }}>
            Log in with any of the 3 pre-seeded demo accounts (Admin, Project Lead, or Team Member) in 1 click.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/login"
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#1A1A2E',
                backgroundColor: '#26C6DA',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(38, 198, 218, 0.4)',
              }}
            >
              Sign In (3 Logins Ready)
            </Link>
            <Link
              to="/register"
              style={{
                padding: '0.85rem 2rem',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#ffffff',
                border: '1px solid #3d4c60',
                backgroundColor: '#2E3A4B',
                textDecoration: 'none',
              }}
            >
              Register New Account
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #2E3A4B',
        padding: '2.5rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#B0BEC5',
        backgroundColor: '#1A1A2E',
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} WorkSync • FinTech Midnight Design System • Space Grotesk
        </p>
      </footer>
    </div>
  )
}
