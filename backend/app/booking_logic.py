"""
Booking Logic Module
Handles conflict detection, validation, and recurring booking generation
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from . import models
from enum import Enum


class RecurrencePattern(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


def check_booking_conflict(
    facility_id: int,
    start_time: datetime,
    end_time: datetime,
    db: Session,
    exclude_booking_id: int = None
) -> tuple[bool, list[dict]]:
    """
    Check if there's a booking conflict for a facility in the given time range.
    
    Args:
        facility_id: ID of the facility to check
        start_time: Proposed booking start time
        end_time: Proposed booking end time
        db: Database session
        exclude_booking_id: Booking ID to exclude from conflict check (for updates)
    
    Returns:
        Tuple of (has_conflict: bool, conflicting_bookings: list[dict])
    """
    
    # Query for confirmed bookings that overlap with the proposed time
    query = db.query(models.Booking).filter(
        models.Booking.facility_id == facility_id,
        models.Booking.status == models.BookingStatus.CONFIRMED,
        models.Booking.start_time < end_time,
        models.Booking.end_time > start_time,
    )
    
    # Exclude the current booking if updating
    if exclude_booking_id:
        query = query.filter(models.Booking.id != exclude_booking_id)
    
    conflicting_bookings = query.all()
    
    has_conflict = len(conflicting_bookings) > 0
    
    # Format conflicting bookings for response
    conflicts = [
        {
            "booking_id": b.id,
            "facility_id": b.facility_id,
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat(),
            "user_id": b.user_id,
        }
        for b in conflicting_bookings
    ]
    
    return has_conflict, conflicts


def validate_booking_times(
    start_time: datetime,
    end_time: datetime,
    cancellation_cutoff_hours: int = 24
) -> tuple[bool, str]:
    """
    Validate booking times.
    
    Args:
        start_time: Proposed start time
        end_time: Proposed end time
        cancellation_cutoff_hours: Hours to allow from now for cancellation
    
    Returns:
        Tuple of (is_valid: bool, error_message: str)
    """
    
    # Use timezone-aware UTC now (matches database timezone-aware datetimes)
    now = datetime.now(timezone.utc)
    
    # Check end time is after start time
    if end_time <= start_time:
        return False, "End time must be after start time"
    
    # Check times are in the future
    if start_time <= now:
        return False, "Start time must be in the future"
    
    # Check booking duration (optional: max 8 hours per booking for classrooms)
    max_duration = timedelta(hours=8)
    if end_time - start_time > max_duration:
        return False, f"Maximum booking duration is {max_duration.total_seconds() / 3600:.0f} hours"
    
    # Check minimum booking duration (at least 30 minutes)
    min_duration = timedelta(minutes=30)
    if end_time - start_time < min_duration:
        return False, "Minimum booking duration is 30 minutes"
    
    return True, ""


def check_cancellation_allowed(
    booking: models.Booking,
    cancellation_cutoff_hours: int = 24
) -> tuple[bool, str]:
    """
    Check if a booking can be cancelled based on cutoff time.
    
    Args:
        booking: Booking object to check
        cancellation_cutoff_hours: Hours before start time to disallow cancellation
    
    Returns:
        Tuple of (can_cancel: bool, message: str)
    """
    
    now = datetime.utcnow()
    time_until_start = booking.start_time - now
    cutoff_delta = timedelta(hours=cancellation_cutoff_hours)
    
    if time_until_start < cutoff_delta:
        hours_left = time_until_start.total_seconds() / 3600
        return False, f"Cannot cancel within {cancellation_cutoff_hours} hours of start. {hours_left:.1f} hours remaining."
    
    return True, ""


def calculate_recurring_slots(
    start_date: datetime,
    end_date: datetime,
    pattern: str,
    session_start_time: str,  # Format: "HH:MM"
    session_end_time: str,    # Format: "HH:MM"
    occurrence_count: int = None
) -> list[tuple[datetime, datetime]]:
    """
    Generate recurring booking slots.
    
    Args:
        start_date: First booking date
        end_date: Last date to generate bookings (ignored if occurrence_count provided)
        pattern: Recurrence pattern (daily, weekly, biweekly, monthly)
        session_start_time: Session start time as "HH:MM"
        session_end_time: Session end time as "HH:MM"
        occurrence_count: Number of occurrences (overrides end_date)
    
    Returns:
        List of (start_time, end_time) tuples
    """
    
    slots = []
    current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Parse time strings
    start_hour, start_minute = map(int, session_start_time.split(":"))
    end_hour, end_minute = map(int, session_end_time.split(":"))
    
    occurrence = 0
    
    while True:
        # Check if we've exceeded the end date or occurrence count
        if occurrence_count and occurrence >= occurrence_count:
            break
        if not occurrence_count and current_date.date() > end_date.date():
            break
        
        # Create slot for current date
        slot_start = current_date.replace(hour=start_hour, minute=start_minute)
        slot_end = current_date.replace(hour=end_hour, minute=end_minute)
        
        slots.append((slot_start, slot_end))
        occurrence += 1
        
        # Advance to next occurrence based on pattern
        if pattern == RecurrencePattern.DAILY:
            current_date += timedelta(days=1)
        elif pattern == RecurrencePattern.WEEKLY:
            current_date += timedelta(weeks=1)
        elif pattern == RecurrencePattern.BIWEEKLY:
            current_date += timedelta(weeks=2)
        elif pattern == RecurrencePattern.MONTHLY:
            # Add one month (simple approach)
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        else:
            break
    
    return slots


def get_facility_availability(
    facility_id: int,
    date: datetime,
    db: Session
) -> dict:
    """
    Get facility availability for a given date.
    
    Args:
        facility_id: ID of the facility
        date: Date to check availability for
        db: Database session
    
    Returns:
        Dict with availability info and occupied slots
    """
    
    # Get all confirmed bookings for the facility on that date
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    bookings = db.query(models.Booking).filter(
        models.Booking.facility_id == facility_id,
        models.Booking.start_time >= start_of_day,
        models.Booking.end_time <= end_of_day,
        models.Booking.status == models.BookingStatus.CONFIRMED
    ).all()
    
    occupied_slots = [
        {
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat(),
            "booking_id": b.id
        }
        for b in bookings
    ]
    
    return {
        "facility_id": facility_id,
        "date": date.date().isoformat(),
        "is_available": len(occupied_slots) == 0,
        "occupied_slots": occupied_slots,
        "total_slots": len(occupied_slots)
    }
