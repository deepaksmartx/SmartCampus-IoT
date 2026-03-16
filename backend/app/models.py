from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str,enum.Enum):
    ADMIN = "Admin"
    FACILITY_MANAGER = "Facility Manager"
    STUDENT = "Student"
    STAFF = "Staff"

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
