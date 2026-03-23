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

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole
    phone_number: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class CampusBase(BaseModel):
    name: str

class CampusCreate(CampusBase):
    pass

class CampusResponse(CampusBase):
    id: int

    class Config:
        from_attributes = True

class BuildingBase(BaseModel):
    name: str
    campus_id: int

class BuildingCreate(BuildingBase):
    pass

class BuildingUpdate(BaseModel):
    name: str | None = None
    campus_id: int | None = None

class BuildingResponse(BuildingBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class FloorBase(BaseModel):
    floor_no: int
    building_id: int

class FloorCreate(FloorBase):
    pass

class FloorUpdate(BaseModel):
    floor_no: int | None = None
    building_id: int | None = None

class FloorResponse(FloorBase):
    id: int

    class Config:
        from_attributes = True