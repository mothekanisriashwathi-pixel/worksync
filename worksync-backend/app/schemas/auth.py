"""
Pydantic schemas for authentication endpoints.

Request schemas:  LoginRequest, RegisterRequest
Response schemas: UserResponse

password_hash and raw passwords are never included in response schemas.
"""
from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    """Body expected by POST /auth/login."""
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    """Body expected by POST /auth/register."""
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be empty.")
        if len(v) > 100:
            raise ValueError("Name must be at most 100 characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if len(v.encode()) > 72:
            raise ValueError("Password must be at most 72 bytes.")
        return v


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """
    Safe representation of a user returned to the client.
    Never exposes password_hash or any secret.
    """
    id: int
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}
