"""
Database Initialization Script for Facilities
Creates tables and seeds test data for facility booking system
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, DATABASE_URL
from app import models
from datetime import datetime, timedelta
import hashlib


def init_db():
    """Initialize database and create all tables"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")


def seed_test_data():
    """Add test data to the database"""
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check if data already exists
        existing_campus = db.query(models.Campus).first()
        if existing_campus:
            print("⚠ Test data already exists. Skipping seed...")
            return

        # Create test users
        admin_user = models.User(
            name="Admin User",
            email="admin@campus.edu",
            hashed_password=hashlib.sha256("admin123".encode()).hexdigest(),
            role=models.UserRole.ADMIN,
            phone_number="+1-555-0100",
        )
        manager_user = models.User(
            name="Facility Manager",
            email="manager@campus.edu",
            hashed_password=hashlib.sha256("manager123".encode()).hexdigest(),
            role=models.UserRole.FACILITY_MANAGER,
            phone_number="+1-555-0101",
        )
        student_user = models.User(
            name="Student User",
            email="student@campus.edu",
            hashed_password=hashlib.sha256("student123".encode()).hexdigest(),
            role=models.UserRole.STUDENT,
            phone_number="+1-555-0102",
        )
        db.add_all([admin_user, manager_user, student_user])
        db.commit()
        print("✓ Test users created")

        # Create campus
        campus = models.Campus(name="Tech University")
        db.add(campus)
        db.commit()
        print("✓ Campus created")

        # Create buildings
        building1 = models.Building(name="Engineering Building", campus_id=campus.id)
        building2 = models.Building(name="Science Building", campus_id=campus.id)
        db.add_all([building1, building2])
        db.commit()
        print("✓ Buildings created")

        # Create floors
        floor1_b1 = models.Floor(floor_no=1, building_id=building1.id)
        floor2_b1 = models.Floor(floor_no=2, building_id=building1.id)
        floor1_b2 = models.Floor(floor_no=1, building_id=building2.id)
        db.add_all([floor1_b1, floor2_b1, floor1_b2])
        db.commit()
        print("✓ Floors created")

        # Create facilities
        facilities = [
            models.Facility(
                name="Engineering Lab A",
                type=models.FacilityType.LAB,
                building_id=building1.id,
                floor_id=floor1_b1.id,
                capacity=30,
                requires_approval=True,
                description="Advanced electronics lab with workstations",
            ),
            models.Facility(
                name="Classroom 101",
                type=models.FacilityType.CLASSROOM,
                building_id=building1.id,
                floor_id=floor1_b1.id,
                capacity=50,
                requires_approval=False,
                description="Standard classroom with projector",
            ),
            models.Facility(
                name="Meeting Room A",
                type=models.FacilityType.MEETING_ROOM,
                building_id=building1.id,
                floor_id=floor2_b1.id,
                capacity=10,
                requires_approval=False,
                description="Small meeting space",
            ),
            models.Facility(
                name="Science Auditorium",
                type=models.FacilityType.AUDITORIUM,
                building_id=building2.id,
                floor_id=floor1_b2.id,
                capacity=200,
                requires_approval=True,
                description="Large auditorium for seminars and lectures",
            ),
            models.Facility(
                name="Library Study Room",
                type=models.FacilityType.LIBRARY,
                building_id=building2.id,
                floor_id=floor1_b2.id,
                capacity=20,
                requires_approval=False,
                description="Quiet study area",
            ),
        ]
        db.add_all(facilities)
        db.commit()
        print("✓ Facilities created")

        # Create sample bookings (some pending, some confirmed)
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        next_week = now + timedelta(days=7)

        # Confirmed booking
        booking1 = models.Booking(
            facility_id=facilities[1].id,  # Classroom 101
            user_id=student_user.id,
            start_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0),
            end_time=tomorrow.replace(hour=12, minute=0, second=0, microsecond=0),
            status=models.BookingStatus.CONFIRMED,
            notes="Study session for midterms",
        )

        # Pending booking (requires approval)
        booking2 = models.Booking(
            facility_id=facilities[0].id,  # Engineering Lab A (requires approval)
            user_id=student_user.id,
            start_time=next_week.replace(hour=14, minute=0, second=0, microsecond=0),
            end_time=next_week.replace(hour=16, minute=0, second=0, microsecond=0),
            status=models.BookingStatus.PENDING,
            notes="Lab experiment for project",
        )

        db.add_all([booking1, booking2])
        db.commit()
        print("✓ Sample bookings created")

        # Create approval records for pending bookings
        approval = models.BookingApproval(
            booking_id=booking2.id,
            status=models.ApprovalStatus.PENDING,
            reason=None,
        )
        db.add(approval)
        db.commit()
        print("✓ Approval records created")

        print("\n✅ Database initialization complete!")
        print("\n📝 Test Credentials:")
        print("  Admin: admin@campus.edu / admin123")
        print("  Manager: manager@campus.edu / manager123")
        print("  Student: student@campus.edu / student123")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Initializing facilities database...\n")
    init_db()
    seed_test_data()
