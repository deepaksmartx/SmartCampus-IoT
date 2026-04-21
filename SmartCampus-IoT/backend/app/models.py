from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from .database import Base
import enum



class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    FACILITY_MANAGER = "Facility Manager"
    STUDENT = "Student"
    STAFF = "Staff"


class FacilityType(str, enum.Enum):
    CLASSROOM = "Classroom"
    LAB = "Lab"
    AUDITORIUM = "Auditorium"
    MEETING_ROOM = "Meeting Room"
    SPORTS_COURT = "Sports Court"
    LIBRARY = "Library"
    CAFE = "Cafe"
    HOSTEL = "Hostel"
    OTHER = "Other"


class BookingStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
    REJECTED = "Rejected"


class ApprovalStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), nullable=True)

    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)

    # ✅ NEW (for hostel logic)
    gender = Column(String(10), nullable=True)  # male / female

    profile_photo = Column(String(500), nullable=True)
    hashed_password = Column(String(255), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())




class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)



class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())



class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    floor_no = Column(Integer, nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)




class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    type = Column(Enum(FacilityType), nullable=False, default=FacilityType.CLASSROOM)

    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)

    capacity = Column(Integer, nullable=False)

    # ✅ NEW (hostel support)
    gender = Column(String(10), default="any")  # male / female / any
    is_hostel = Column(Boolean, default=False)

    requires_approval = Column(Boolean, default=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())




class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)

    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)

    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)

    # ✅ NEW (important for hostel logic)
    user_role = Column(Enum(UserRole), nullable=True)
    room_number = Column(String(50), nullable=True)
    bed_number = Column(String(50), nullable=True)

    recurring_group_id = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())




class BookingApproval(Base):
    __tablename__ = "booking_approvals"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING)
    reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())




class Waitlist(Base):
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    facility_id = Column(Integer, ForeignKey("facilities.id"))

    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())




class FailedBooking(Base):
    __tablename__ = "failed_bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    facility_id = Column(Integer, ForeignKey("facilities.id"))

    reason = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
