"""
Shared FastAPI dependencies.

get_current_user  — reads the access_token cookie, decodes the JWT,
                    loads and returns the active User from the database.

require_roles     — factory that returns a dependency enforcing one or
                    more permitted roles (403 when the role is insufficient).
"""
from typing import Callable

from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate the HTTP-only cookie and return the authenticated User.

    Raises:
        401 — cookie absent, token invalid/expired, user not found
        401 — user account is inactive
    """
    _unauth = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated.",
    )

    if access_token is None:
        raise _unauth

    try:
        payload = decode_access_token(access_token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise _unauth
    except JWTError:
        raise _unauth

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise _unauth

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been deactivated.",
        )

    return user


# ---------------------------------------------------------------------------
# require_roles
# ---------------------------------------------------------------------------

def require_roles(*allowed_roles: UserRole) -> Callable:
    """
    Return a FastAPI dependency that permits only the specified roles.

    Usage in a route:
        @router.get("/admin-only", dependencies=[Depends(require_roles(UserRole.ADMIN))])

    Or as a typed dependency that also provides the user object:
        def my_route(current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER))):
            ...

    Raises:
        401 — not authenticated (delegated to get_current_user)
        403 — authenticated but role not in allowed_roles
    """
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return _check
