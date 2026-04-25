from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Boolean, Text, DECIMAL
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
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)  # Restricted to: Admin, Facility Manager, Student, Staff
    profile_photo = Column(String(500), nullable=True)         # stores URL or file path
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User id={self.id} name={self.name} email={self.email} role={self.role}>"

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

    def __repr__(self):
        return f"<Building id={self.id} name={self.name} campus_id={self.campus_id}>"

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    floor_no = Column(Integer, nullable=False)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)

    def __repr__(self):
        return f"<Floor id={self.id} floor_no={self.floor_no} building_id={self.building_id}>"


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(FacilityType), nullable=False, default=FacilityType.CLASSROOM)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False)
    floor_id = Column(Integer, ForeignKey("floors.id"), nullable=True)
    capacity = Column(Integer, nullable=False)
    requires_approval = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Facility id={self.id} name={self.name} building_id={self.building_id}>"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    recurring_group_id = Column(String(255), nullable=True)  # Groups recurring bookings
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Booking id={self.id} facility_id={self.facility_id} user_id={self.user_id} status={self.status}>"


class BookingApproval(Base):
    __tablename__ = "booking_approvals"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING)
    reason = Column(Text, nullable=True)  # Approval or rejection reason
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<BookingApproval id={self.id} booking_id={self.booking_id} status={self.status}>"
    
class FailedBooking(Base):
    __tablename__ = "failed_bookings"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=True)

    facility_name = Column(String(255), nullable=True)
    reason = Column(Text, nullable=False)

    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())