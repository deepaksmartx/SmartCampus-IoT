"""
Booking Logic Module
Handles:
- Conflict detection
- Time validation
- Hostel booking logic (capacity, gender)
- Waitlist
- Failed booking logging
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from . import models



def validate_booking_times(start_time: datetime, end_time: datetime):
    now = datetime.now(timezone.utc)

    if end_time <= start_time:
        return False, "End time must be after start time"

    if start_time <= now:
        return False, "Start time must be in the future"

    if end_time - start_time > timedelta(hours=8):
        return False, "Max booking duration is 8 hours"

    if end_time - start_time < timedelta(minutes=30):
        return False, "Minimum booking duration is 30 minutes"

    return True, ""




def check_booking_conflict(facility_id, start_time, end_time, db: Session):
    conflicts = db.query(models.Booking).filter(
        models.Booking.facility_id == facility_id,
        models.Booking.status == models.BookingStatus.CONFIRMED,
        models.Booking.start_time < end_time,
        models.Booking.end_time > start_time
    ).all()

    return len(conflicts) > 0, conflicts



def process_hostel_booking(user, facility, start_time, end_time, db: Session):

    1️⃣ Validate time
    valid, msg = validate_booking_times(start_time, end_time)
    if not valid:
        log_failed_booking(user.id, facility.id, msg, db)
        return {"status": "failed", "reason": msg}

    2️⃣ Gender restriction
    if facility.gender != "any" and user.gender != facility.gender:
        reason = "Gender not allowed for this hostel"
        log_failed_booking(user.id, facility.id, reason, db)
        return {"status": "failed", "reason": reason}

    3️⃣ Check conflict
    has_conflict, _ = check_booking_conflict(facility.id, start_time, end_time, db)

    # 4️⃣ Count active bookings
    active_count = db.query(models.Booking).filter(
        models.Booking.facility_id == facility.id,
        models.Booking.status == models.BookingStatus.CONFIRMED
    ).count()

    5️⃣ Capacity check
    if active_count >= facility.capacity or has_conflict:

        # Priority: Student > Staff
        if user.role == models.UserRole.STUDENT:

            # Try replacing non-student booking
            replace = db.query(models.Booking).filter(
                models.Booking.facility_id == facility.id,
                models.Booking.status == models.BookingStatus.CONFIRMED,
                models.Booking.user_role != models.UserRole.STUDENT
            ).first()

            if replace:
                replace.status = models.BookingStatus.CANCELLED
                db.commit()
            else:
                return add_to_waitlist(user, facility, start_time, end_time, db)

        else:
            return add_to_waitlist(user, facility, start_time, end_time, db)

    6️⃣ Create booking
    booking = models.Booking(
        facility_id=facility.id,
        user_id=user.id,
        start_time=start_time,
        end_time=end_time,
        status=models.BookingStatus.CONFIRMED,
        user_role=user.role
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return {
        "status": "confirmed",
        "booking_id": booking.id
    }



def add_to_waitlist(user, facility, start_time, end_time, db: Session):
    wait = models.Waitlist(
        user_id=user.id,
        facility_id=facility.id,
        start_time=start_time,
        end_time=end_time
    )

    db.add(wait)
    db.commit()

    return {
        "status": "waitlisted",
        "message": "Added to waitlist"
    }




def log_failed_booking(user_id, facility_id, reason, db: Session):
    failed = models.FailedBooking(
        user_id=user_id,
        facility_id=facility_id,
        reason=reason
    )

    db.add(failed)
    db.commit()



def get_facility_availability(facility_id, date: datetime, db: Session):
    start = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)

    bookings = db.query(models.Booking).filter(
        models.Booking.facility_id == facility_id,
        models.Booking.start_time >= start,
        models.Booking.end_time <= end,
        models.Booking.status == models.BookingStatus.CONFIRMED
    ).all()

    slots = [
        {
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat()
        }
        for b in bookings
    ]

    return {
        "facility_id": facility_id,
        "date": date.date().isoformat(),
        "booked_slots": slots,
        "total_bookings": len(slots)
    }
