"""
Authentication router — /auth prefix.

Endpoints
---------
POST /auth/register   — create a new MEMBER account
POST /auth/login      — verify credentials, set HTTP-only cookie
POST /auth/logout     — clear the auth cookie
GET  /auth/me         — return the currently authenticated user
"""
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services.auth import authenticate_user, create_token_for_user, register_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Name of the HTTP-only cookie that carries the JWT.
_COOKIE_NAME = "access_token"


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new member account",
)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Create a new account.  Role is always MEMBER — admins are created
    through the admin user-management API (a later batch).
    """
    user = register_user(
        db=db,
        name=body.name,
        email=body.email,
        password=body.password,
    )
    return user


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=UserResponse,
    summary="Log in and receive an HTTP-only session cookie",
)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Verify credentials.  On success, set an HTTP-only cookie containing
    the JWT and return the authenticated user's public profile.
    """
    user = authenticate_user(db=db, email=body.email, password=body.password)
    token = create_token_for_user(user)

    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        # samesite="lax" works for same-origin and cross-origin requests that
        # arrive via a top-level navigation.  It is compatible with the React
        # dev server sending requests to FastAPI via the Vite proxy.
        samesite="lax",
        # secure=False during development (HTTP).  Set to True behind HTTPS.
        secure=False,
        max_age=60 * 60,  # 1 hour — matches ACCESS_TOKEN_EXPIRE_MINUTES=60
    )
    return user


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------

@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out and clear the session cookie",
)
def logout(response: Response):
    """
    Clear the access_token cookie.  Safe to call even when already
    logged out — the cookie delete is idempotent.
    """
    response.delete_cookie(key=_COOKIE_NAME, httponly=True, samesite="lax")


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Return the currently authenticated user",
)
def me(current_user: User = Depends(get_current_user)):
    """
    Requires a valid access_token cookie.
    Returns the authenticated user's public profile.
    """
    return current_user
