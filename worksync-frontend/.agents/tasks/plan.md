# WorkSync Frontend Implementation Plan

> **Execution order: Task 12 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 13+14 → 15**

## Codebase findings

- `main.jsx` renders `<App />` with no router; `App.jsx` uses client-side `useState('dashboard')` for navigation. BrowserRouter is absent — Task 1 adds it.
- `AuthContext.jsx` exposes `{ user, role, loading, setUser, clearUser }`. `user` shape is `{ id, name, email, role, is_active }`. Role values are uppercase: `ADMIN`, `MANAGER`, `MEMBER`.
- `react-router-dom@6.26.2` is already installed in `package.json`. No new packages needed.
- `axiosInstance.js` uses `baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'` with `withCredentials: true`.
- `authApi.js` has `getMe`, `login`, `logout` — missing `register`. Task 2 adds it.
- `teamsApi.js` and `usersApi.js` are empty stubs. Task 2 populates them.
- `notificationsApi.js` has `getNotifications` and `markNotificationRead` — fully implemented, no changes needed.
- `tasksApi.js` has `getTasks` and `updateTask` — fully implemented, no changes needed.
- `projectsApi.js` has `getProjects` — fully implemented, no changes needed.
- `AppShell.jsx` accepts `activePage` and `onNavigate` props — Task 7 replaces these with `useLocation`/`useNavigate`.
- `Header.jsx` hardcodes `DEMO_NOTIFICATIONS`, `'SA'` avatar, `'Sri Ashwathi'`/`'Team Manager'` — Task 6 replaces all with real data.
- `variables.css` uses old token values (e.g., `--color-primary-500: #6949d0`, `--surface-page: #fff9ef`) — Task 12 updates these.
- `Dashboard.jsx` already uses `normaliseStatus` / `normalisePriority` helpers. Tasks 8/9 must reuse the same logic.
- `TaskItem.jsx` expects lowercase status keys: `todo`, `inprogress`, `inreview`, `completed`. Same for priority.
- `global.css` ends after section 18+ (loading/skeleton). Task 13+14 appends to the END without modifying existing sections.
- Existing CSS classes to preserve: `.task-card`, `.project-card`, `.member-card`, `.badge-*`, `.btn-*`, `.input`, `.stat-card`, `.sidebar-*`, `.header-*`, `.app-shell`, `.main-wrapper`.
- Pages directory has `pages/auth/`, `pages/admin/`, `pages/manager/`, `pages/member/` — new pages land in `pages/landing/`, `pages/projects/`, `pages/tasks/`, `pages/team/`, `pages/settings/`.
- `WorkSyncIcons.jsx` exports all required icons including `IconProjects`, `IconTasks`, `IconTeam`, `IconSettings`, `IconDashboard`, `IconCheck`, `IconWarning`, `IconSearch`, `IconMenu`, `IconClose`, `IconNotifications`.
- Build command: `npx vite build` (from `package.json` scripts: `"build": "vite build"`).

---

- [ ] 1. **Update design tokens in `variables.css`**

  Update only the listed tokens — do not remove any existing token. Apply the new brand palette values using targeted replacements:
  - `--color-primary-500: #6D4AFF`
  - `--color-primary-600: #5938DC`
  - `--color-primary-800: #241536`
  - `--surface-page: #FAF8F5`
  - `--color-neutral-800: #241B35`
  - `--color-neutral-500: #777184`
  - `--color-neutral-200: #E9E3EE`
  - `--color-success-600: #26966A`
  - `--color-warning-600: #E99A28`
  - `--color-danger-600: #D94F5C`
  - `--color-info-600: #3297D3`
  - `--sidebar-bg: #241536`
  - `--focus-ring: 0 0 0 3px rgba(109, 74, 255, 0.3)`
  - `--sidebar-item-active-bg: rgba(109, 74, 255, 0.18)`

  Also add the missing `--color-neutral-900` token (needed for landing footer): `--color-neutral-900: #1A1023` if not present. Add `--color-neutral-400: #9E8FAA` for footer text. These are additive — do not remove any existing tokens.

  Files: `src/styles/variables.css`

  Verify: `npx vite build` — build completes with no errors (CSS variable changes have no build-time errors, but confirms file is valid).

---

- [ ] 2. **Set up BrowserRouter and replace App.jsx routing**

  In `main.jsx`, wrap `<App />` in `<BrowserRouter>` (imported from `react-router-dom`). Rewrite `App.jsx` with `Routes`/`Route` from `react-router-dom`:

  - Remove `useState('dashboard')` and `PlaceholderPage`.
  - Define `ProtectedRoute`: reads `{ user, loading }` from `useAuth()`; if `loading` renders a centered `<span className="spinner spinner-lg">` identical to the existing loading pattern in the old `AppInner`; if `!user` renders `<Navigate to="/login" replace />`; otherwise renders `children`.
  - Define `PublicOnlyRoute`: same loading spinner; if `user` renders `<Navigate to="/dashboard" replace />`; otherwise renders `children`.
  - Routes:
    - `/` → `<LandingPage />`
    - `/login` → `PublicOnlyRoute` → `<LoginPage />`
    - `/register` → `PublicOnlyRoute` → `<RegisterPage />`
    - `/dashboard` → `ProtectedRoute` → `<AppShell><Dashboard /></AppShell>`
    - `/projects` → `ProtectedRoute` → `<AppShell><ProjectsPage /></AppShell>`
    - `/tasks` → `ProtectedRoute` → `<AppShell><TasksPage /></AppShell>`
    - `/team` → `ProtectedRoute` → `<AppShell><TeamPage /></AppShell>`
    - `/settings` → `ProtectedRoute` → `<AppShell><SettingsPage /></AppShell>`
  - Pass `role={role?.toLowerCase() ?? 'manager'}` and `user={{ name: user?.name ?? 'there' }}` as props to `<Dashboard>` (preserving the existing Dashboard prop interface).
  - Import all page components. At this stage, `LandingPage`, `LoginPage`, `RegisterPage`, `ProjectsPage`, `TasksPage`, `TeamPage`, `SettingsPage` will be created as minimal stubs if they don't yet exist, so this step can complete and build. Each stub exports a default function returning `<div>Page coming soon</div>`.
  - Keep `<AuthProvider>` wrapping everything in `App.jsx`.

  Files: `src/main.jsx`, `src/App.jsx`

  Stub files (created here so imports resolve): `src/pages/landing/LandingPage.jsx`, `src/pages/auth/LoginPage.jsx`, `src/pages/auth/RegisterPage.jsx`, `src/pages/projects/ProjectsPage.jsx`, `src/pages/tasks/TasksPage.jsx`, `src/pages/team/TeamPage.jsx`, `src/pages/settings/SettingsPage.jsx`

  Verify: `npx vite build` — no missing-module errors.

---

- [ ] 3. **Populate stub API modules**

  Replace the empty stub files with real implementations:

  **`teamsApi.js`**:
  ```js
  import api from './axiosInstance'
  export const getTeams = () => api.get('/teams').then(r => r.data)
  export const getTeamMembers = (teamId) => api.get(`/teams/${teamId}/members`).then(r => r.data)
  ```

  **`usersApi.js`**:
  ```js
  import api from './axiosInstance'
  // Admin only — callers must handle 403
  export const getUsers = () => api.get('/users').then(r => r.data)
  ```

  **`authApi.js`** — add `register` export (keep `getMe`, `login`, `logout` unchanged):
  ```js
  export const register = (name, email, password) =>
    api.post('/auth/register', { name, email, password }).then(r => r.data)
  ```

  Files: `src/api/teamsApi.js`, `src/api/usersApi.js`, `src/api/authApi.js`

  Verify: `npx vite build` — no errors.

---

- [ ] 4. **Create LandingPage**

  Replace the stub at `src/pages/landing/LandingPage.jsx` with a full landing page. No AppShell — this is a standalone public page.

  Structure (all in one file; extract no separate files):
  1. **PublicNav** (internal component): sticky top bar. Logo mark (`<div className="public-nav-logo-mark">W</div>` + `<span className="public-nav-logo-text">WorkSync</span>`). Nav links as `<a>` tags with href `#features`, `#how-it-works`, `#benefits`. Actions: `<Link to="/login">Sign In</Link>` + `<Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>`. Mobile hamburger button (`IconMenu`) toggles a dropdown `.public-nav-mobile-menu` with the same links. Use `useState` for hamburger open state.

  2. **Hero section**: Two-column grid (`.hero-inner`). Left (`.hero-content`): `<h1 className="hero-headline">Your team's work, finally in sync.</h1>`, subtext paragraph (`.hero-subtext`), CTA row (`.hero-actions`): `<Link to="/register" className="btn btn-primary">Get Started</Link>` + `<a href="#features" className="btn btn-secondary">Explore Features</a>`. Right (`.hero-preview`): mini dashboard mockup using `.mini-stat-grid` (4 mini stat cards: "12 Projects", "48 Tasks", "6 In Review", "23 Done"), `.mini-bar-chart` (3 bar rows with inline `style={{ width: 'X%' }}` on `.mini-bar-fill`), `.mini-task-preview` (3 `.mini-task-item` rows with `.mini-task-dot` colored via `style={{ background: 'var(--color-primary-500)' }}`). All data is illustrative/hardcoded.

  3. **Value statement section** (`.value-section`): Single paragraph text: "WorkSync brings your team's projects, tasks, and progress into one organized workspace — so everyone knows what needs to happen and when."

  4. **Features section** (`id="features"`, `.features-section`): Section header with eyebrow "Features", title "Everything your team needs", subtitle. Features grid (`.features-grid`) with 6 `.feature-card` items. Each card: `.feature-icon-wrap` containing a `WorkSyncIcons` icon, `.feature-title`, `.feature-desc`. Icons and descriptions:
     - Project Management — `IconProjects` — "Organize projects with clear goals, due dates, and progress tracking."
     - Task Tracking — `IconTasks` — "Manage assignments, set priorities, track due dates, and update statuses."
     - Team Collaboration — `IconTeam` — "Organize team responsibilities and keep everyone aligned."
     - Progress Visibility — `IconProgress` — "Understand task and project completion at a glance."
     - Review Workflows — `IconWarning` — "Identify work awaiting review so nothing gets blocked."
     - Notifications — `IconNotifications` — "Stay informed about task updates, assignments, and team activity."

  5. **How It Works section** (`id="how-it-works"`, `.steps-section`): Section header. Steps grid (`.steps-grid`) with 3 `.step-item` items: `.step-number` (1, 2, 3), `.step-title`, `.step-desc`:
     - "Create or join a workspace" — "Set up your team and invite members to get started."
     - "Organize projects and assign tasks" — "Break work into projects, create tasks, and assign them to the right people."
     - "Track progress and complete work together" — "Monitor progress, review submissions, and close out work as a team."

  6. **Product preview section** (`id="benefits"`, `.preview-section`): Section header with title "See WorkSync in action". Dashboard preview (`.preview-dashboard`): stats grid (`.preview-stats-grid`) with 4 `.preview-stat-card` items (hardcoded illustrative data). Preview body (`.preview-body`): left column with a progress list using existing `.progress-bar`/`.progress-fill` classes, right column with task items using existing `.task-card` classes. CTA below (`.preview-cta`): `<Link to="/register" className="btn btn-primary">Get Started</Link>`.

  7. **Final CTA section** (`.cta-section`): `<h2 className="cta-title">Bring your team's work together.</h2>` + `<Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>`.

  8. **Footer** (`.landing-footer`): `.footer-inner` with `.footer-brand` (logo mark + "WorkSync"), `.footer-links` with `<a>` tags for Features/How It Works/Sign In, `.footer-tagline` "WorkSync — team and project management."

  Imports: `Link` from `react-router-dom`; named icon exports from `../../components/common/WorkSyncIcons`; no `useState` beyond hamburger toggle; no external libraries.

  The entire file uses CSS classes from `variables.css` tokens and the new landing-page classes added in Task 13+14. No hardcoded hex colors in JSX — use `style={{ color: 'var(--color-primary-500)' }}` or CSS classes.

  Files: `src/pages/landing/LandingPage.jsx`

  Verify: `npx vite build` — no import errors.

---

- [ ] 5. **Create LoginPage**

  Replace stub at `src/pages/auth/LoginPage.jsx`:

  - Outer: `<div className="auth-page">` wrapping `<div className="auth-card">`.
  - Logo: `.auth-logo` div with `.auth-logo-mark` ("W") + `.auth-logo-text` ("WorkSync").
  - Title (`<h1 className="auth-title">`) "Welcome back", subtitle (`.auth-subtitle`) "Sign in to your WorkSync account".
  - Form (`.auth-form`): two `.form-group` blocks — Email (`<input type="email" className="input">`) and Password (`<input type="password" className="input">`). Both have `<label className="form-label">`. Use `useState` for each field value.
  - Error display: `{error && <div className="auth-error">{error}</div>}`.
  - Submit button: `<button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>` — shows "Signing in…" text when loading.
  - Footer text (`.auth-footer-text`): "Don't have an account? `<Link to="/register">Sign up</Link>`"
  - On submit: call `authApi.login(email, password)` → `setUser(data)` → `navigate('/dashboard')`. On error: set error message from `err.response?.data?.detail ?? 'Login failed'`.
  - Use `useAuth()` for `setUser`. Use `useNavigate()` from `react-router-dom`. Use `useState` for `email`, `password`, `error`, `loading`.
  - Basic validation: if email or password empty, set error "Please fill in all fields" without making API call.

  Files: `src/pages/auth/LoginPage.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 6. **Create RegisterPage**

  Replace stub at `src/pages/auth/RegisterPage.jsx`:

  - Same layout pattern as LoginPage: `.auth-page` → `.auth-card` → logo → title/subtitle → form.
  - Title "Create your account", subtitle "Join WorkSync and start collaborating".
  - Form fields: Name (`<input type="text">`), Email (`<input type="email">`), Password (`<input type="password">`).
  - On submit: call `authApi.register(name, email, password)` then `authApi.login(email, password)` → `setUser(data)` → `navigate('/dashboard')`. On any error: show inline error.
  - Footer text: "Already have an account? `<Link to="/login">Sign in</Link>`"
  - Same loading/error state pattern as LoginPage.

  Files: `src/pages/auth/RegisterPage.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 7. **Upgrade Header to use real data**

  Modify `src/components/common/Header.jsx`:

  - Add imports: `useNavigate` from `react-router-dom`; `useAuth` from `../../context/AuthContext`; `getNotifications`, `markNotificationRead` from `../../api/notificationsApi`.
  - Remove the `DEMO_NOTIFICATIONS` constant entirely.
  - Add state: `const [notifications, setNotifications] = useState([])`.
  - Add `useEffect` that calls `getNotifications().then(setNotifications).catch(() => {})` on mount.
  - Derive `unreadCount` from `notifications.filter(n => !n.is_read).length`.
  - Time-ago formatting: define a local `timeAgo(isoString)` helper identical to the one in Dashboard (diffMin < 1 → "just now", < 60 → "X min ago", < 1440 → "X hr ago", else "X days ago").
  - Replace hardcoded `'SA'` avatar with `initials(user?.name)` — compute initials as: split name by spaces, take first letter of first two words, uppercase, default `'?'` if no user.
  - Replace hardcoded `'Sri Ashwathi'` with `user?.name ?? ''` and `'Team Manager'` with `user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : ''` (e.g., "MANAGER" → "Manager").
  - On notification `<li>` click: call `markNotificationRead(n.id).then(() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x)))`.
  - "Log Out" button: call `authApi.logout().finally(() => { clearUser(); navigate('/login') })`.
  - "Account Settings" button: call `navigate('/settings')`.
  - Keep ALL existing CSS classes, JSX structure, dropdown logic, and close-on-outside-click behavior unchanged.
  - `useAuth()` destructure: `const { user, clearUser } = useAuth()`.
  - Add import: `{ logout } from '../../api/authApi'` (use named import to avoid collision with the `logout` function name — alias as `logoutApi` if needed).

  Files: `src/components/common/Header.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 8. **Upgrade AppShell to use react-router-dom navigation**

  Modify `src/components/common/AppShell.jsx`:

  - Add imports: `useNavigate`, `useLocation` from `react-router-dom`.
  - Derive `activePage` from `useLocation().pathname`:
    ```js
    const { pathname } = useLocation()
    const activePage = pathname === '/dashboard' ? 'dashboard'
      : pathname === '/projects'  ? 'projects'
      : pathname === '/tasks'     ? 'tasks'
      : pathname === '/team'      ? 'team'
      : pathname === '/settings'  ? 'settings'
      : 'dashboard'
    ```
  - Add `const navigate = useNavigate()`.
  - Define a `PATH_MAP = { dashboard: '/dashboard', projects: '/projects', tasks: '/tasks', team: '/team', settings: '/settings' }`.
  - Replace `handleNavigate` to: `navigate(PATH_MAP[page] ?? '/dashboard')` and still call `setDrawerOpen(false)`.
  - Remove `activePage` and `onNavigate` from the component's props destructuring. They are no longer passed by the parent — AppShell is self-contained for routing.
  - Keep ALL other behavior: sidebar collapse/expand, mobile drawer, text-size preference, localStorage persistence, resize handlers, body scroll lock, `pageTitle` derivation.
  - Pass `activePage` (now derived internally) and `handleNavigate` (now using navigate) to `<Sidebar>` and the mobile drawer items unchanged.

  Files: `src/components/common/AppShell.jsx`

  Verify: `npx vite build` — no errors. The `App.jsx` routes now render `<AppShell>` without props (no `activePage`/`onNavigate` needed).

---

- [ ] 9. **Create ProjectsPage**

  Replace stub at `src/pages/projects/ProjectsPage.jsx`:

  - Reuse the `normaliseStatus`, `formatDueDate`, `isOverdue`, `adaptProject` helpers from Dashboard. Copy them inline into this file — do not import from Dashboard (it's a page component, not a utility module). Use the same `tasksByProject` derivation logic.
  - Fetch: `Promise.all([getProjects(), getTasks()])` in a single `useEffect`. Track `loading` and `error` state.
  - Derive `projects` array: for each project, compute `tasksTotal`, `tasksDone` (tasks with `status === 'COMPLETED'`), and `progress` (percentage). Compute `status` by mapping backend enum to badge class:
    - `PLANNING` → `badge-todo` label "Planning"
    - `IN_PROGRESS` → `badge-inprogress` label "In Progress"
    - `COMPLETED` → `badge-completed` label "Completed"
    - `ON_HOLD` → `badge-warning` label "On Hold"
  - Page header: `<div className="page-header">` with `<h1 className="page-title">Projects</h1>` and `<p className="body-text">Organize and track your team's projects.</p>`.
  - Controls row: `.filter-bar` containing `.page-search` (input with `.page-search-input`, `IconSearch` as `.page-search-icon`) and filter buttons (`.filter-btn`, active variant `.filter-btn active`). Status filters: All, Planning, In Progress, Completed, On Hold. Manage `searchTerm` and `activeFilter` with `useState`.
  - Client-side filter: filter projects where `name.toLowerCase().includes(searchTerm.toLowerCase())` and status matches `activeFilter` (case-insensitive comparison to backend status string).
  - Project cards grid: `<div className="projects-grid">`. For each project, render a `<div className="project-card">` containing:
    - Top row: project name (`<p>` with `font-weight: semibold`) + status badge (`<span className={\`badge ${badgeClass}\`}>`).
    - Due date (if present): `<span className="caption">` with `IconCalendar`.
    - Progress bar: reuse `.progress-bar` / `.progress-fill` classes.
    - Footer: task count caption + `tasksDone/tasksTotal tasks`.
  - Loading state: 4 skeleton cards — `<div className="project-card">` with `.skeleton.skeleton-text` divs inside.
  - Empty state: `<div className="empty-state">` with `<IconProjects className="empty-state-icon">`, title "No projects yet", description "Projects you have access to will appear here."
  - Error state: `<div className="alert alert-warning">` with error message.

  Files: `src/pages/projects/ProjectsPage.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 10. **Create TasksPage**

  Replace stub at `src/pages/tasks/TasksPage.jsx`:

  - Reuse `normaliseStatus`, `normalisePriority`, `formatDueDate`, `isOverdue`, `adaptTask` helpers (copy inline).
  - Fetch `getTasks()` and `getProjects()` in parallel (needed for `projectMap` to build the `project` display name in each adapted task). Track `loading`, `error`.
  - Page header: `<h1 className="page-title">Tasks</h1>` + `<p className="body-text">Manage and track your assignments.</p>`.
  - Filter row (`.tasks-filter-row`): search input (`.page-search`), Status select (`<select className="input">` options: All, TODO, IN_PROGRESS, IN_REVIEW, COMPLETED), Priority select (All, LOW, MEDIUM, HIGH, URGENT). Manage `searchTerm`, `statusFilter`, `priorityFilter` with `useState`.
  - Client-side filter: by search (title contains), status (raw `_raw.status`), priority (raw `_raw.priority`). Only apply filter if not "All".
  - Tasks list (`.tasks-list`): render filtered tasks using existing `<TaskItem>` component with `showAssignee={false}` (assignee name not available). Pass `key={task.id}`.
  - Inline status update: add a `<select className="task-status-select">` to each task row, rendered after `<TaskItem>` in a wrapper div. Options: TODO, IN_PROGRESS, IN_REVIEW, COMPLETED. On change: call `updateTask(task.id, { status: selectedValue })` then re-fetch tasks (call `getTasks()` again and update state). On 403 error: set a per-task error string displayed in a small `.alert-danger` below the row; do not crash.
  - Implementation note: wrap each task in `<div style={{ position: 'relative' }}>` with the `TaskItem` and the select + per-task error inside.
  - Loading state: 5 skeleton rows using the same pattern as Dashboard's `SkeletonRows`.
  - Empty state: `<div className="empty-state">` with `IconTasks`, "No tasks found", description.
  - Error state: `<div className="alert alert-warning">`.

  Files: `src/pages/tasks/TasksPage.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 11. **Create TeamPage**

  Replace stub at `src/pages/team/TeamPage.jsx`:

  - Fetch strategy: fetch `getTeams()` first. Then `Promise.all(teams.map(t => getTeamMembers(t.id)))` to get members for each team in parallel. If `role === 'ADMIN'`, also fetch `getUsers()` (catch 403 gracefully — set `usersMap` to `{}`). Use a single loading/error state. All fetching in one `useEffect`.
  - `usersMap`: `Object.fromEntries(users.map(u => [u.id, u]))` — enables O(1) name lookup.
  - Member display: if `role === 'ADMIN'` and user exists in `usersMap`, show `user.name`; otherwise show `Member #${member.user_id}`.
  - `const { user, role } = useAuth()` — role from context (uppercase: 'ADMIN', 'MANAGER', 'MEMBER').
  - Page header: `<h1 className="page-title">Team</h1>` + description.
  - Search input (`.page-search`): client-side filter teams by `name`.
  - For each team: render a `.team-section` div. Inside: `.team-section-header` with team name (`<h2 className="section-heading">`) and description (`.caption`). Members grid (`.team-member-grid`): each member in `.team-member-item` with a `.avatar.avatar-sm` (initials from name or `M` fallback) and member name text.
  - Loading state: 2 skeleton sections.
  - Empty state: `<div className="empty-state">` with `IconTeam`, "No teams found".
  - Error state: `<div className="alert alert-warning">`.

  Files: `src/pages/team/TeamPage.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 12. **Create SettingsPage**

  Replace stub at `src/pages/settings/SettingsPage.jsx`:

  - `const { user, clearUser } = useAuth()` — no separate API fetch needed.
  - `const navigate = useNavigate()`.
  - Text size state: `const [textSize, setTextSize] = useState(() => localStorage.getItem('ws_text_size') ?? 'default')`.
  - `useEffect` applying text size: `document.documentElement.setAttribute('data-text-size', textSize); localStorage.setItem('ws_text_size', textSize)` whenever `textSize` changes.
  - Page header: `<h1 className="page-title">Settings</h1>`.
  - Outer container: `<div className="settings-page">`.
  - **Profile card** (`.settings-card`): title "Profile". Rows (`.settings-field-row`):
    - Name: `.settings-field-label` "Name" + `.settings-field-value` `{user?.name}`.
    - Email: `.settings-field-label` "Email" + `.settings-field-value` `{user?.email}`.
    - Role: `.settings-field-label` "Role" + `<span className="badge badge-primary">` `{user?.role}`.
    - Status: `.settings-field-label` "Account Status" + `<span className={\`badge ${user?.is_active ? 'badge-success' : 'badge-danger'}\`}>` `{user?.is_active ? 'Active' : 'Inactive'}`.
    - Below rows: `<p className="caption">Profile editing is not available in this version.</p>`.
  - **Appearance card** (`.settings-card`): title "Appearance". Subtitle "Adjust the text size across the application." Text size grid (`.text-size-grid`) with 4 `.text-size-btn` buttons. Active button gets `.text-size-btn active` class. Options and values: Small (`small`), Default (`default`), Large (`large`), Extra Large (`xlarge`). Each button shows the label and a sample text size.
  - **Account card** (`.settings-card`): title "Account". `<button className="btn btn-destructive" onClick={handleSignOut}>Sign Out</button>`. `handleSignOut`: calls `authApi.logout().finally(() => { clearUser(); navigate('/login') })`.

  Files: `src/pages/settings/SettingsPage.jsx`

  Verify: `npx vite build` — no errors.

---

- [ ] 13. **Append landing page and new page CSS to global.css**

  Append all new CSS classes to the END of `src/styles/global.css`. Do NOT modify any existing lines — only add after the last existing rule.

  Append in this order:

  **Section comment**: `/* ============================================================\n   LANDING PAGE STYLES\n   ============================================================ */`

  Then all landing page classes exactly as specified in Task 13 of the task brief:
  - `.landing-page`, `.public-nav`, `.public-nav-inner`, `.public-nav-logo`, `.public-nav-logo-mark`, `.public-nav-logo-text`, `.public-nav-links`, `.public-nav-link`, `.public-nav-actions`, `.public-nav-hamburger`, `.public-nav-mobile-menu`, `.hero-section`, `.hero-inner` (with responsive grid), `.hero-content`, `.hero-headline` (with media query variants), `.hero-subtext`, `.hero-actions`, `.hero-preview`, `.mini-stat-grid`, `.mini-stat-card`, `.mini-stat-value`, `.mini-stat-label`, `.mini-bar-chart`, `.mini-bar-row`, `.mini-bar-label`, `.mini-bar-track`, `.mini-bar-fill`, `.mini-task-preview`, `.mini-task-item`, `.mini-task-dot`, `.mini-task-title`, `.mini-task-badge`, `.value-section`, `.value-text`, `.features-section`, `.section-inner`, `.section-header`, `.section-eyebrow`, `.section-title`, `.section-subtitle`, `.features-grid` (with responsive breakpoints), `.feature-card`, `.feature-icon-wrap`, `.feature-title`, `.feature-desc`, `.steps-section`, `.steps-grid` (with responsive), `.step-item`, `.step-number`, `.step-title`, `.step-desc`, `.preview-section`, `.preview-dashboard`, `.preview-stats-grid` (with responsive), `.preview-stat-card`, `.preview-body` (with responsive), `.preview-cta`, `.cta-section`, `.cta-title`, `.landing-footer`, `.footer-inner`, `.footer-brand`, `.footer-links`, `.footer-link`, `.footer-tagline`.

  **Section comment**: `/* AUTH PAGE STYLES */`
  - `.auth-page`, `.auth-card`, `.auth-logo`, `.auth-logo-mark`, `.auth-logo-text`, `.auth-title`, `.auth-subtitle`, `.auth-form`, `.auth-error`, `.auth-footer-text`.

  **Section comment**: `/* PROJECTS PAGE STYLES */`
  - `.projects-grid` (2-col desktop, 1-col mobile), `.filter-bar`, `.filter-btn`, `.filter-btn.active`, `.page-search`, `.page-search-icon`, `.page-search-input`.

  **Section comment**: `/* TASKS PAGE STYLES */`
  - `.tasks-filter-row`, `.tasks-list`, `.task-status-select`.

  **Section comment**: `/* TEAM PAGE STYLES */`
  - `.team-section`, `.team-section-header`, `.team-member-grid`, `.team-member-item`.

  **Section comment**: `/* SETTINGS PAGE STYLES */`
  - `.settings-page`, `.settings-card`, `.settings-section-title`, `.settings-field-row`, `.settings-field-label`, `.settings-field-value`, `.text-size-grid`, `.text-size-btn`, `.text-size-btn.active`.

  All property values must use CSS variables from `variables.css` (e.g., `var(--color-primary-500)`, `var(--space-6)`, `var(--border-color)`) — no hardcoded hex colors.

  The `.hero-headline` responsive rules must be inside `@media` blocks: 40px at max-width 1024px, 32px at max-width 768px. `.features-grid` uses `repeat(3,1fr)` desktop → `repeat(2,1fr)` at 1024px → `1fr` at 640px. `.steps-grid` uses `repeat(3,1fr)` → `1fr` at 768px. `.preview-stats-grid` uses `repeat(4,1fr)` → `repeat(2,1fr)` at 640px. `.preview-body` uses `1fr 1fr` → `1fr` at 768px.

  Files: `src/styles/global.css`

  Verify: `npx vite build` — build succeeds. Check that landing page structure renders at `/` by confirming no CSS syntax errors in build output.

---

- [ ] 14. **Production build — verify and fix all errors**

  Run the final production build from the frontend root and fix any remaining issues:

  ```
  cd c:\Users\Sri Ashwathi\OneDrive\Desktop\WorkSync\worksync-frontend && npx vite build
  ```

  Common issues to check and fix:
  - Any import that references a file not yet created (all stubs should exist from Task 2).
  - Any JSX syntax error in newly created pages.
  - Any CSS variable reference that doesn't exist in `variables.css` (e.g., `--color-primary-100`, `--color-primary-700` used in `.mini-task-badge` — add to `variables.css` if missing).
  - Verify `--color-neutral-400`, `--color-neutral-900` are defined (used in footer).
  - The build must complete with exit code 0 and no errors in stderr.

  If build errors remain, read the full error output and fix the specific file/line reported. Do not change backend files. Do not install new packages.

  Files: fix any file reported in build errors

  Verify: `npx vite build` exits with code 0.

---

## Verification checklist

Before marking done, confirm all of these pass:

1. `npx vite build` exits 0 with no errors.
2. No `import` in any `.jsx` file references a path that does not exist.
3. No hardcoded hex colors in JSX — all colors via `var(--token-name)` in CSS classes or `style={{ color: 'var(--token-name)' }}`.
4. No backend files modified (nothing under `worksync-backend/`).
5. No new packages added to `package.json`.
6. `useAuth()` is the single source of auth state — no component fetches `/auth/me` directly except `AuthContext.jsx`.
7. All API calls use `axiosInstance` (imported via the existing API modules).
8. AppShell is NOT used in `LandingPage`, `LoginPage`, or `RegisterPage`.
9. `authApi.register` is implemented and `RegisterPage` calls it.
10. `teamsApi.getTeams` and `teamsApi.getTeamMembers` are implemented and `TeamPage` calls both.
