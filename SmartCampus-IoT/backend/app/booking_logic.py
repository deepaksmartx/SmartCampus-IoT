from typing import Optional

# Example roles
class UserRole(str, Enum):
    STUDENT = "student"
    GUEST = "guest"
    ADMIN = "admin"


# ✅ NEW: Capacity + Gender + Priority + Waitlist
def process_hostel_booking(
    user: models.User,
    facility: models.Facility,
    start_time: datetime,
    end_time: datetime,
    db: Session
):
    """
    Smart hostel booking logic:
    - Capacity check
    - Gender restriction
    - Priority handling
    - Waitlist support
    """

    # 1️⃣ Validate time
    valid, msg = validate_booking_times(start_time, end_time)
    if not valid:
        return {"status": "failed", "reason": msg}

    # 2️⃣ Gender restriction (if hostel has rule)
    if facility.gender and facility.gender != user.gender:
        return {
            "status": "failed",
            "reason": "Gender not allowed for this hostel"
        }

    # 3️⃣ Check existing bookings count
    active_bookings = db.query(models.Booking).filter(
        models.Booking.facility_id == facility.id,
        models.Booking.status == models.BookingStatus.CONFIRMED,
        models.Booking.start_time < end_time,
        models.Booking.end_time > start_time,
    ).count()

    # 4️⃣ Capacity check
    if active_bookings >= facility.capacity:

        # Priority logic
        if user.role == UserRole.STUDENT:
            # Try to replace a guest booking (optional advanced logic)
            guest_booking = db.query(models.Booking).filter(
                models.Booking.facility_id == facility.id,
                models.Booking.user_role == UserRole.GUEST,
                models.Booking.status == models.BookingStatus.CONFIRMED
            ).first()

            if guest_booking:
                guest_booking.status = models.BookingStatus.CANCELLED
                db.commit()
            else:
                return add_to_waitlist(user, facility, start_time, end_time, db)

        else:
            return add_to_waitlist(user, facility, start_time, end_time, db)

    # 5️⃣ No conflict → Confirm booking
    new_booking = models.Booking(
        user_id=user.id,
        facility_id=facility.id,
        start_time=start_time,
        end_time=end_time,
        status=models.BookingStatus.CONFIRMED
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return {
        "status": "confirmed",
        "booking_id": new_booking.id
    }


# ✅ NEW: Waitlist system
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


# ✅ NEW: Failed booking logger
def log_failed_booking(user, facility, reason, db: Session):
    failed = models.FailedBooking(
        user_id=user.id,
        facility_id=facility.id,
        reason=reason
    )

    db.add(failed)
    db.commit()
