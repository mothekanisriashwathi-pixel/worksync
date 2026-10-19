# WorkSync 🚀

> **A modern, full-stack team collaboration and project management platform built for agile workflows, cross-functional teams, and streamlined task delivery.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite_5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy_2.0-D71F00?style=flat)](https://www.sqlalchemy.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20%2F%20MySQL-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 Table of Contents 
System Design:-

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Available Scripts](#-available-scripts)
- [Roadmap & Future Enhancements](#-roadmap--future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**WorkSync** is designed to eliminate workflow friction by consolidating project tracking, task delegation, team collaboration, and deliverable review cycles into a unified, responsive interface.

Whether you are an **Administrator** overseeing company-wide resources, a **Project Lead** orchestrating sprints and reviewing member submissions, or a **Team Member** executing day-to-day deliverables, WorkSync tailors the experience to your specific responsibilities through robust Role-Based Access Control (RBAC).

---

## ✨ Key Features

### 👥 Role-Based Access Control (RBAC)
- **Admin**: Full oversight over system configuration, user accounts, teams, and project permissions.
- **Project Lead / Manager**: Create and organize projects, delegate tasks, set milestones, and approve or request revisions on deliverable submissions.
- **Team Member**: View assigned tasks, track personal deadlines, submit work with attachments/links, and participate in discussion threads.

### 📊 Project & Milestone Tracking
- Centralized project catalog with visual status badges (`Planning`, `In Progress`, `Review`, `Completed`) and priority levels.
- Assign project leads and track team allocation, completion percentages, and delivery targets.

### 📋 Task Management & Workflow Pipeline
- Flexible task tracking across workflow stages: **To Do**, **In Progress**, **In Review**, and **Completed**.
- Priority tagging (`Low`, `Medium`, `High`, `Urgent`), deadline monitoring, and clear assignment indicators.

### 📤 Submissions & Review Workflow
- Members can submit task deliverables directly with notes and attachment URLs.
- Leads can accept submissions to finalize tasks or reject them with specific actionable feedback.

### 💬 Threaded Task Comments
- Collaborative discussions linked directly to task contexts for transparent communication and audit trails.

### 🔔 Real-Time Notification Center
- In-app notification bell alerting users to newly assigned tasks, review feedback, comments, and project status shifts.

### 🔒 Enterprise-Grade Security
- Secure password hashing with `bcrypt`.
- JWT-based authorization utilizing HTTP-only cookies and protected client-side routes with automatic auth persistence.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["React Frontend (Vite, React Router v6)"]
    API["FastAPI Backend (Uvicorn ASGI)"]
    DB[("Database (SQLite / MySQL via SQLAlchemy 2.0)")]

    Client -- "REST API / HTTP-only Cookies" --> API
    API -- "ORM Queries / Migrations" --> DB
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/)
- **Build Tool**: [Vite 5](https://vitejs.dev/)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (configured with cookie credentials)
- **Styling**: Modern Vanilla CSS Design System with CSS Custom Properties, glassmorphism, responsive AppShell, and micro-animations.

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: [Uvicorn](https://www.uvicorn.org/) ASGI
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Database**: SQLite (default zero-config development database) or MySQL (PyMySQL)
- **Data Validation**: [Pydantic v2](https://docs.pydantic.dev/) & Pydantic-Settings
- **Authentication**: `python-jose` (JWT), `passlib` & `bcrypt`
- **Database Migrations**: [Alembic](https://alembic.sqlalchemy.org/)

---

## 📂 Repository Structure

```text
worksync/
├── package.json               # Root scripts & unified dev runner (concurrently)
├── scripts/
│   └── start-backend.js       # Cross-platform Python venv & backend launcher
├── worksync-frontend/         # React SPA client
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── api/               # Axios API endpoints & interceptors
│       ├── components/        # UI components (AppShell, Header, Modals, etc.)
│       ├── context/           # AuthContext & global state
│       ├── pages/             # Route views (Landing, Dashboard, Projects, Tasks, Team, Settings)
│       └── styles/            # CSS variables & global styling
└── worksync-backend/          # FastAPI Python service
    ├── main.py                # App entrypoint, CORS & demo seed logic
    ├── requirements.txt       # Python dependencies
    ├── alembic.ini            # Database migration configuration
    ├── .env.example
    └── app/
        ├── core/              # Config, DB engine, and security utilities
        ├── models/            # SQLAlchemy database models
        ├── schemas/           # Pydantic request/response schemas
        ├── routers/           # API routes (auth, users, teams, projects, tasks, etc.)
        └── services/          # Business logic handlers
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9.0.0 or higher)
- [Python](https://www.python.org/) (v3.10 or higher)
- [pip](https://pip.pypa.io/en/stable/)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mothekanisriashwathi-pixel/worksync.git
   cd worksync
   ```

2. **Install all dependencies (Frontend & Backend):**

   From the repository root, run the one-command installer:
   ```bash
   npm run install:all
   ```

   *Alternatively, install each service manually:*
   ```bash
   # Install root concurrently tool
   npm install

   # Install frontend dependencies
   npm --prefix worksync-frontend install

   # Install backend Python dependencies
   pip install -r worksync-backend/requirements.txt
   ```

---

### Environment Configuration

#### 1. Backend (`worksync-backend/.env`)
Copy the template file:
```bash
cp worksync-backend/.env.example worksync-backend/.env
```
*(On Windows PowerShell: `Copy-Item worksync-backend/.env.example worksync-backend/.env`)*

By default, WorkSync operates on an embedded SQLite database (`worksync.db`) without requiring MySQL installation. If you prefer MySQL, update the `DATABASE_URL` in `.env`:
```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/worksync
SECRET_KEY=your_strong_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
APP_ENV=development
# Optional
GITHUB_TOKEN=            # raises GitHub API rate limits; never sent to the browser
MAX_UPLOAD_MB=10         # submission attachment size limit
```

- `APP_ENV=development` seeds the demo accounts shown on the login page (and resets their passwords on every start). Any other value skips demo seeding and **requires** a real `SECRET_KEY` — the backend refuses to start with the built-in default.
- Submission attachments are stored on local disk in `worksync-backend/uploads/submissions/` (git-ignored). Back this folder up with the database.

#### Database migrations
Run after installing and after every pull that adds a migration (safe on existing data):
```bash
cd worksync-backend
python -m alembic upgrade head
```

#### 2. Frontend (`worksync-frontend/.env`)
Copy the template file:
```bash
cp worksync-frontend/.env.example worksync-frontend/.env
```
*(On Windows PowerShell: `Copy-Item worksync-frontend/.env.example worksync-frontend/.env`)*

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

### Running the Application

You can launch both the frontend and backend simultaneously using the root runner:

```bash
npm run dev
```

This starts:
- 🌐 **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- ⚡ **Backend API**: [http://localhost:8000](http://localhost:8000)

#### Running Services Separately
If you prefer running the processes in separate terminal windows:

- **Frontend only:**
  ```bash
  npm run dev:frontend
  ```
- **Backend only:**
  ```bash
  npm run dev:backend
  ```
  *(or `cd worksync-backend && uvicorn main:app --reload --port 8000`)*

---

## 🔑 Demo Credentials

WorkSync automatically seeds four demo accounts on backend startup for quick evaluation:

| Role | Full Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Alex Admin | `admin@worksync.com` | `admin123` |
| **Project Lead** | Sarah Lead | `lead@worksync.com` | `lead123` |
| **Team Member** | Pavan Member | `member@worksync.com` | `member123` |
| **Manager** | Demo Manager | `demo@worksync.com` | `password123` |

You can also create a new account anytime via the **/register** page.

---

## 📚 API Documentation

Once the backend is running, interactive API documentation is automatically generated by FastAPI:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Primary API Endpoints

| Category | Endpoint | Method | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `/auth/login` | `POST` | Authenticate user & issue session cookie |
| | `/auth/logout` | `POST` | Clear auth session |
| | `/auth/register` | `POST` | Register a new user |
| | `/auth/me` | `GET` | Get current authenticated user profile |
| **Projects** | `/projects` | `GET` / `POST` | List and create projects |
| | `/projects/{id}` | `GET` / `PUT` / `DELETE` | Manage a project |
| **Tasks** | `/tasks` | `GET` / `POST` | List and create tasks |
| | `/tasks/{id}` | `GET` / `PUT` / `DELETE` | Manage a task |
| **Submissions**| `/submissions` | `POST` | Submit deliverable for a task |
| | `/submissions/{id}/review` | `POST` | Approve or reject a submission |
| **Comments** | `/tasks/{task_id}/comments` | `GET` / `POST` | Task discussion threads |
| **Teams** | `/teams` | `GET` / `POST` | Team roster and members |
| **Notifications** | `/notifications` | `GET` / `PUT` | In-app notification feed |

---

## 🛠️ Available Scripts

From the root project directory:

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Runs both React frontend and FastAPI backend concurrently |
| `npm run dev:frontend` | Runs only the Vite React dev server |
| `npm run dev:backend` | Runs only the FastAPI Uvicorn dev server |
| `npm run install:all` | Installs root, frontend, and Python backend dependencies |
| `npm run build` | Builds the React frontend production bundle to `dist/` |
| `npm run lint` | Runs ESLint across the frontend codebase |

---

## 🗺️ Roadmap & Future Enhancements

- [ ] Real-time WebSockets for instant task updates and live chat.
- [ ] Drag-and-drop interactive Kanban task board view.
- [ ] File attachments upload directly to cloud storage (S3 / Cloudinary).
- [ ] Exportable sprint reports (PDF/CSV) with burndown analytics.
- [ ] Calendar view with Google Calendar / Outlook integration.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
