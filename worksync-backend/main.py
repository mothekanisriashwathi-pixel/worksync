"""
WorkSync API — application entry point.

Start the development server with:
    uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth as auth_router

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

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/", tags=["health"])
def root():
    return {"message": "WorkSync API is running."}
