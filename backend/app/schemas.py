from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "Admin"
    FACILITY_MANAGER = "Facility Manager"
    STUDENT = "Student"
    STAFF = "Staff"

class UserResponse(BaseModel):
    """User profile response - excludes sensitive data like password"""
    id: int
    name: str
    email: str
    phone_number: str | None = None
    role: UserRole
    profile_photo: str | None = None
    created_at: datetime
    updated_at: datetime | None = None  # Can be None if user hasn't been updated

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy ORM objects

class ErrorResponse(BaseModel):
    detail: str
