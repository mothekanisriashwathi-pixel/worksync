import { Link } from 'react-router-dom'
import { AuroraBackdrop } from '../../components/common/AuthLayout'
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
      backgroundColor: '#080b12',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-family)',
      position: 'relative',
    }}>
      {/* ── Navigation ────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(8, 11, 18, 0.8)',
        borderBottom: '1px solid #1b2230',
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
            background: 'linear-gradient(135deg, #22d3ee 0%, #1b2230 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#080b12',
            fontWeight: 800,
            fontSize: '1.35rem',
            boxShadow: '0 4px 14px rgba(34, 211, 238, 0.35)',
          }}>
            W
          </div>
          <span style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #ffffff 0%, #22d3ee 100%)',
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
              color: '#a3acbb',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              border: '1px solid #1b2230',
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
              color: '#080b12',
              backgroundColor: '#22d3ee',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(34, 211, 238, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Ambient React Bits Aurora behind the hero (static gradient under reduced motion / small screens) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 720, zIndex: 0, maskImage: 'linear-gradient(#000 55%, transparent)', WebkitMaskImage: 'linear-gradient(#000 55%, transparent)' }}>
        <AuroraBackdrop opacity={0.6} />
      </div>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '4rem 1.5rem', maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 4rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(34, 211, 238, 0.12)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            color: '#22d3ee',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
          }}>
            <span>Projects · Tasks · Reviews · GitHub</span>
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
              background: 'linear-gradient(135deg, #22d3ee 0%, #80deea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Ship Projects Faster.
            </span>
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: '#a3acbb',
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
                color: '#080b12',
                backgroundColor: '#22d3ee',
                textDecoration: 'none',
                boxShadow: '0 6px 24px rgba(34, 211, 238, 0.45)',
                transition: 'all 0.2s ease',
              }}
            >
              Create an account →
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
                backgroundColor: '#1b2230',
                border: '1px solid #2a3344',
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
          backgroundColor: '#1b2230',
          borderRadius: '16px',
          border: '1px solid #2a3344',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(34, 211, 238, 0.1)',
          overflow: 'hidden',
          marginBottom: '4.5rem',
        }}>
          <div style={{
            backgroundColor: '#080b12',
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid #2a3344',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
              <span style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#22d3ee' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: '#a3acbb', fontWeight: 600 }}>
              How a WorkSync project moves
            </span>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ padding: '2.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.75rem' }}>
            <div style={{
              backgroundColor: '#080b12',
              padding: '1.65rem',
              borderRadius: '12px',
              border: '1px solid #2a3344',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee' }}>
                  <IconProjects size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Plan</h4>
                  <span style={{ fontSize: '0.8rem', color: '#a3acbb' }}>Projects, teams and deadlines</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#a3acbb', lineHeight: 1.5 }}>
                Leads create projects for their team, assign tasks with priorities and due dates, and progress is calculated from completed work.
              </p>
            </div>

            <div style={{
              backgroundColor: '#080b12',
              padding: '1.65rem',
              borderRadius: '12px',
              border: '1px solid #2a3344',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee' }}>
                  <IconTasks size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Submit &amp; review</h4>
                  <span style={{ fontSize: '0.8rem', color: '#a3acbb' }}>Versioned deliverables</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ padding: '4px 10px', borderRadius: 4, backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', fontSize: '0.8rem', fontWeight: 700 }}>
                  Submitted → In Review
                </span>
                <span style={{ padding: '4px 10px', borderRadius: 4, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>
                  Approved / Changes requested
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: '#080b12',
              padding: '1.65rem',
              borderRadius: '12px',
              border: '1px solid #2a3344',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee' }}>
                  <IconTeam size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Role-based access</h4>
                  <span style={{ fontSize: '0.8rem', color: '#a3acbb' }}>Admin · Manager / lead · Member</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#a3acbb', lineHeight: 1.5 }}>
                Every request is authorized on the server: members see their teams, leads and managers review their projects, admins oversee everything.
              </p>
            </div>
          </div>
        </div>

        {/* ── Feature Highlights Grid ─────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
          gap: '1.5rem',
          marginBottom: '4.5rem',
        }}>
          <div style={{
            padding: '1.75rem',
            backgroundColor: '#1b2230',
            borderRadius: '14px',
            border: '1px solid #2a3344',
          }}>
            <div style={{ color: '#22d3ee', marginBottom: '1rem' }}>
              <IconDashboard size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Unified Dashboard</h3>
            <p style={{ fontSize: '0.925rem', color: '#a3acbb', lineHeight: 1.5 }}>
              Role-aware view of your projects, task status, upcoming deadlines, review queue and recent activity.
            </p>
          </div>

          <div style={{
            padding: '1.75rem',
            backgroundColor: '#1b2230',
            borderRadius: '14px',
            border: '1px solid #2a3344',
          }}>
            <div style={{ color: '#22d3ee', marginBottom: '1rem' }}>
              <IconTasks size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Kanban Management</h3>
            <p style={{ fontSize: '0.925rem', color: '#a3acbb', lineHeight: 1.5 }}>
              Dynamic column boards across To Do, In Progress, In Review, and Completed with instant status switching.
            </p>
          </div>

          <div style={{
            padding: '1.75rem',
            backgroundColor: '#1b2230',
            borderRadius: '14px',
            border: '1px solid #2a3344',
          }}>
            <div style={{ color: '#22d3ee', marginBottom: '1rem' }}>
              <IconNotifications size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Live Notifications</h3>
            <p style={{ fontSize: '0.925rem', color: '#a3acbb', lineHeight: 1.5 }}>
              Automated notifications for task assignments, submissions, approvals, and team milestone updates.
            </p>
          </div>

          <div style={{
            padding: '1.75rem',
            backgroundColor: '#1b2230',
            borderRadius: '14px',
            border: '1px solid #2a3344',
          }}>
            <div style={{ color: '#22d3ee', marginBottom: '1rem' }}>
              <IconCheck size={30} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ffffff' }}>Enterprise Security</h3>
            <p style={{ fontSize: '0.925rem', color: '#a3acbb', lineHeight: 1.5 }}>
              HTTP-only cookie exchange, bcrypt password hashing, CORS protection, and SQLite/MySQL backends.
            </p>
          </div>
        </div>

        {/* ── Call To Action Banner ────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1b2230 0%, #080b12 100%)',
          borderRadius: '16px',
          border: '1px solid #2a3344',
          padding: '3.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4)',
        }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: '#ffffff' }}>
            Elevate Your Team&apos;s Productivity Today
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#a3acbb', maxWidth: 620, margin: '0 auto 2.25rem auto' }}>
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
                color: '#080b12',
                backgroundColor: '#22d3ee',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(34, 211, 238, 0.4)',
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
                border: '1px solid #2a3344',
                backgroundColor: '#1b2230',
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
        borderTop: '1px solid #1b2230',
        padding: '2.5rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#a3acbb',
        backgroundColor: '#080b12',
      }}>
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} WorkSync · Background effect: Aurora by React Bits
        </p>
      </footer>
    </div>
  )
}
