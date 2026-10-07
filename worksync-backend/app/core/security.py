"""
Password hashing and JWT creation/verification.
All secrets come from app.core.config — nothing is hardcoded here.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

# bcrypt is the hashing scheme. deprecated="auto" silently upgrades old hashes.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of the given plaintext password."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if the plaintext password matches the stored hash."""
    return _pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def create_access_token(
    user_id: int,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT containing user_id, role, and expiration.

    Args:
        user_id: The authenticated user's database id.
        role:    The user's role string (e.g. "ADMIN", "MANAGER", "MEMBER").
        expires_delta: Override the default expiry window.

    Returns:
        A signed JWT string.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {
        "sub": str(user_id),   # subject — the user's id as a string
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT.

    Returns:
        The decoded payload dict with at least {"sub": ..., "role": ...}.

    Raises:
        JWTError: if the token is invalid, expired, or tampered with.
    """
    # jwt.decode raises JWTError on any problem — callers handle it.
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
