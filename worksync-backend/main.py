"""
WorkSync API — application entry point.

Start the development server with:
    uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth as auth_router
from app.routers import user as user_router
from app.routers import team as team_router
from app.routers import project as project_router
from app.routers import task as task_router
from app.routers import comment as comment_router
from app.routers import submission as submission_router
from app.routers import notification as notification_router
from app.routers import dashboard as dashboard_router
# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="WorkSync API",
    description="Team and project management platform.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS
#
# The React dev server runs on http://localhost:5173 (Vite default).
# allow_credentials=True is required so the browser sends and receives
# HTTP-only cookies across the localhost:5173 → localhost:8000 boundary.
#
# In production, replace the origin list with the real frontend domain
# and set the cookie's secure=True flag in routers/auth.py.
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,          # needed for HTTP-only cookie exchange
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(team_router.router)
app.include_router(project_router.router)
app.include_router(task_router.router)
app.include_router(comment_router.router)
app.include_router(submission_router.router)
app.include_router(notification_router.router)
app.include_router(dashboard_router.router)
@app.on_event("startup")
def on_startup():
    from app.core.database import Base, engine, SessionLocal
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # Seed demo accounts for the 3 distinct roles: Admin, Project Lead, Person (Member)
    from app.models.user import User, UserRole
    from app.core.security import hash_password
    db = SessionLocal()
    try:
        accounts = [
            ("Alex Admin", "admin@worksync.com", "admin123", UserRole.ADMIN),
            ("Sarah Lead", "lead@worksync.com", "lead123", UserRole.MANAGER),
            ("Pavan Member", "member@worksync.com", "member123", UserRole.MEMBER),
            ("Demo Manager", "demo@worksync.com", "password123", UserRole.MANAGER),
        ]
        for name, email, pwd, role in accounts:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                u = User(
                    name=name,
                    email=email,
                    password_hash=hash_password(pwd),
                    role=role,
                    is_active=True,
                )
                db.add(u)
            else:
                existing.role = role
                existing.password_hash = hash_password(pwd)
        db.commit()

        # Seed initial team and membership if no teams exist
        from app.models.team import Team, TeamMember
        if db.query(Team).count() == 0:
            demo_mgr = db.query(User).filter(User.email == "demo@worksync.com").first()
            if demo_mgr:
                default_team = Team(
                    name="Product Engineering",
                    description="Core development and platform engineering team.",
                    manager_id=demo_mgr.id,
                )
                db.add(default_team)
                db.commit()
                db.refresh(default_team)

                # Add members to team
                members = db.query(User).filter(User.role == UserRole.MEMBER).all()
                for m in members:
                    tm = TeamMember(team_id=default_team.id, user_id=m.id)
                    db.add(tm)
                db.commit()
    except Exception as e:
        print(f"Error seeding demo accounts: {e}")
        db.rollback()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def root():
    return {"message": "WorkSync API is running."}
