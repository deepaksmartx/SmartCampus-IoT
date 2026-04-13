from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "Admin"
    FACILITY_MANAGER = "Facility Manager"
    STUDENT = "Student"
    STAFF = "Staff"

class FacilityType(str, Enum):
    BUS = "Bus"
    DINING = "Dining"
    SPORTS = "Sports"
    CLASSROOM = "Classroom"
    LAB = "Lab"
    AUDITORIUM = "Auditorium"
    MEETING_ROOM = "Meeting Room"
    SPORTS_COURT = "Sports Court"
    LIBRARY = "Library"
    CAFE = "Cafe"
    HOSTEL = "Hostel"
    CUSTOM = "Custom"
    OTHER = "Other"

class AcademicPeriod(str, Enum):
    SEMESTER = "Semester"
    TRIMESTER = "Trimester"

class BookingStatus(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    REJECTED = "Rejected"

class ApprovalStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

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


# ─────── Facility Schemas ───────
class FacilityBase(BaseModel):
    name: str
    type: FacilityType
    subtype: str | None = None
    custom_type: str | None = None
    building_id: int
    floor_id: int | None = None
    capacity: int
    requires_approval: bool = False
    sensor_id: str | None = None
    manager_id: int | None = None
    description: str | None = None

class FacilityCreate(FacilityBase):
    pass

class FacilityUpdate(BaseModel):
    name: str | None = None
    type: FacilityType | None = None
    subtype: str | None = None
    custom_type: str | None = None
    building_id: int | None = None
    floor_id: int | None = None
    capacity: int | None = None
    requires_approval: bool | None = None
    sensor_id: str | None = None
    manager_id: int | None = None
    description: str | None = None

class FacilityResponse(FacilityBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# ─────── Booking Schemas ───────
class BookingBase(BaseModel):
    facility_id: int
    start_time: datetime | None = None
    end_time: datetime | None = None
    academic_period: AcademicPeriod | None = None
    notes: str | None = None

class BookingCreate(BookingBase):
    recurring_pattern: str | None = None  # daily, weekly, biweekly, monthly
    occurrence_count: int | None = None   # Number of recurring occurrences

class BookingUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    academic_period: AcademicPeriod | None = None
    notes: str | None = None

class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: BookingStatus
    recurring_group_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class BookingDetailResponse(BookingResponse):
    """Extended booking response with facility details"""
    facility_name: str | None = None
    user_name: str | None = None
    approval_status: ApprovalStatus | None = None


# ─────── Booking Approval Schemas ───────
class BookingApprovalBase(BaseModel):
    reason: str | None = None

class BookingApprovalCreate(BookingApprovalBase):
    pass

class BookingApprovalResponse(BaseModel):
    id: int
    booking_id: int
    approver_id: int | None = None
    status: ApprovalStatus
    reason: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# ─────── Conflict Response Schema ───────
class ConflictInfo(BaseModel):
    booking_id: int
    facility_id: int
    start_time: datetime
    end_time: datetime
    user_id: int

class BookingConflictResponse(BaseModel):
    has_conflict: bool
    conflicts: list[ConflictInfo] = []


# ─────── Availability Response Schema ───────
class OccupiedSlot(BaseModel):
    start_time: datetime
    end_time: datetime
    booking_id: int

class FacilityAvailabilityResponse(BaseModel):
    facility_id: int
    date: str
    is_available: bool
    occupied_slots: list[OccupiedSlot] = []
    total_slots: int


class InventoryBase(BaseModel):
    facility_id: int
    item_name: str
    quantity: int
    unit: str | None = None
    status: str = "available"


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    item_name: str | None = None
    quantity: int | None = None
    unit: str | None = None
    status: str | None = None


class InventoryResponse(InventoryBase):
    id: int

    class Config:
        from_attributes = True