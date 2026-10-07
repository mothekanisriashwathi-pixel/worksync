"""
Authentication business logic.

Functions here are called by the auth router.
They contain no HTTP logic — only database queries and security calls —
which keeps the router thin and makes the logic easy to test independently.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

def register_user(db: Session, name: str, email: str, password: str) -> User:
    """
    Create a new MEMBER account.

    Public registration always produces a MEMBER role.
    ADMIN and MANAGER accounts must be created by an admin through
    the user-management API (a later batch).

    Raises:
        HTTPException 409 if the email is already taken.
    """
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=UserRole.MEMBER,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Verify credentials and return the User object on success.

    Raises:
        HTTPException 401 on any failure (user not found, wrong password,
        or inactive account).  A single vague message prevents enumeration.
    """
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise _invalid

    if not verify_password(password, user.password_hash):
        raise _invalid

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated.",
        )

    return user


def create_token_for_user(user: User) -> str:
    """Return a signed JWT for the given user."""
    return create_access_token(user_id=user.id, role=user.role.value)
