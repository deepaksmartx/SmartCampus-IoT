"""
Booking Management Routes
Handles facility bookings, availability checks, and conflict detection
"""
from app.services.booking_audit import log_failed_booking
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from app.database import get_db
from app import models, schemas
from app.auth import verify_token
from app.models import UserRole, BookingStatus, ApprovalStatus
from app.booking_logic import (
    check_booking_conflict,
    validate_booking_times,
    check_cancellation_allowed,
    calculate_recurring_slots,
    get_facility_availability,
)
import uuid

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


# ─────── Role Helpers ───────
def require_admin(user):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")


# ─────── GET: List Bookings ───────
@router.get("/", response_model=list[schemas.BookingResponse])
def list_user_bookings(
    status_filter: str = Query(None),  # pending, confirmed, cancelled, rejected
    facility_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get user's bookings. Can filter by status and facility.
    """
    query = db.query(models.Booking).filter(models.Booking.user_id == current_user.id)

    if status_filter:
        try:
            status_enum = BookingStatus[status_filter.upper()]
            query = query.filter(models.Booking.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status filter")

    if facility_id:
        query = query.filter(models.Booking.facility_id == facility_id)

    bookings = query.order_by(models.Booking.start_time.desc()).all()
    return bookings


@router.get("/admin/all", response_model=list[schemas.BookingResponse])
def list_all_bookings(
    status_filter: str = Query(None),
    facility_id: int = Query(None),
    user_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get all bookings (Admin/Facility Manager only).
    Can filter by status, facility, or user.
    """
    require_admin_or_manager(current_user)

    query = db.query(models.Booking)

    if status_filter:
        try:
            status_enum = BookingStatus[status_filter.upper()]
            query = query.filter(models.Booking.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid status filter")

    if facility_id:
        query = query.filter(models.Booking.facility_id == facility_id)

    if user_id:
        query = query.filter(models.Booking.user_id == user_id)

    bookings = query.order_by(models.Booking.start_time.desc()).all()
    return bookings

# ✅ Put this FIRST
@router.get("/failed")
def get_failed_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    require_admin_or_manager(current_user)
    return db.query(models.FailedBooking).order_by(models.FailedBooking.created_at.desc()).all()

# ─────── GET: Single Booking ───────
@router.get("/{booking_id}", response_model=schemas.BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get booking details. Users can only view their own; managers/admins can view all.
    """
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Access control: user can only see own bookings; managers/admins can see all
    if (
        current_user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]
        and booking.user_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this booking")

    return booking


# ─────── POST: Create Booking ───────
@router.post("/", response_model=schemas.BookingResponse, status_code=201)
def create_booking(
    booking_data: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Create a new booking.
    - Students can only book for themselves
    - Validates times and checks for conflicts
    - Sets status to PENDING if facility requires approval, else CONFIRMED
    - Can generate recurring bookings with recurring_pattern and occurrence_count
    """

    # 1. Verify facility exists
    facility = db.query(models.Facility).filter(models.Facility.id == booking_data.facility_id).first()
    if not facility:
        log_failed_booking(
        db,
        current_user.id,
        booking_data.facility_id,
        None,
        "Facility not found",
        booking_data.start_time,
        booking_data.end_time
    )
        raise HTTPException(status_code=404, detail="Facility not found")

    # 2. Validate booking times
    is_valid, error_msg = validate_booking_times(booking_data.start_time, booking_data.end_time)
    if not is_valid:
        log_failed_booking(
        db,
        current_user.id,
        booking_data.facility_id,
        facility.name if facility else None,
        error_msg,
        booking_data.start_time,
        booking_data.end_time
    )
        raise HTTPException(status_code=400, detail=error_msg)

    # 3. Check for conflicts
    has_conflict, conflicts = check_booking_conflict(
        booking_data.facility_id,
        booking_data.start_time,
        booking_data.end_time,
        db,
    )
    if has_conflict:
        log_failed_booking(
        db,
        current_user.id,
        booking_data.facility_id,
        facility.name,
        "Booking conflict detected",
        booking_data.start_time,
        booking_data.end_time
    )
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Booking conflict detected",
                "conflicts": conflicts,
            }
        )

    # 4. Determine booking status based on facility requirements
    booking_status = (
        BookingStatus.PENDING
        if facility.requires_approval
        else BookingStatus.CONFIRMED
    )

    # 5. Create booking(s)
    recurring_group_id = None
    bookings_created = []

    if booking_data.recurring_pattern and booking_data.occurrence_count:
        # Generate recurring slots
        recurring_group_id = str(uuid.uuid4())
        slots = calculate_recurring_slots(
            booking_data.start_time.replace(hour=0, minute=0, second=0, microsecond=0),
            booking_data.start_time.replace(hour=0, minute=0, second=0, microsecond=0),
            booking_data.recurring_pattern,
            booking_data.start_time.strftime("%H:%M"),
            booking_data.end_time.strftime("%H:%M"),
            booking_data.occurrence_count,
        )

        # Check conflicts for all recurring slots
        for slot_start, slot_end in slots:
            has_conflict, _ = check_booking_conflict(
                booking_data.facility_id,
                slot_start,
                slot_end,
                db,
            )
            if has_conflict:
                raise HTTPException(
                    status_code=409,
                    detail=f"Conflict detected in recurring booking at {slot_start.isoformat()}",
                )

        # Create all recurring bookings
        for slot_start, slot_end in slots:
            booking = models.Booking(
                facility_id=booking_data.facility_id,
                user_id=current_user.id,
                start_time=slot_start,
                end_time=slot_end,
                status=booking_status,
                recurring_group_id=recurring_group_id,
                notes=booking_data.notes,
            )
            db.add(booking)
            bookings_created.append(booking)

        db.commit()
        # Return first booking; client can fetch others using recurring_group_id
        db.refresh(bookings_created[0])
        return bookings_created[0]
    else:
        # Single booking
        booking = models.Booking(
            facility_id=booking_data.facility_id,
            user_id=current_user.id,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            status=booking_status,
            notes=booking_data.notes,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)

        # 6. Create approval record if facility requires approval
        if facility.requires_approval:
            approval = models.BookingApproval(
                booking_id=booking.id,
                status=ApprovalStatus.PENDING,
            )
            db.add(approval)
            db.commit()

        return booking


# ─────── PUT: Modify Booking ───────
@router.put("/{booking_id}", response_model=schemas.BookingResponse)
def update_booking(
    booking_id: int,
    booking_data: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Update a booking (time/notes). Only the booking owner can modify.
    Checks conflicts with new times.
    """

    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this booking")

    # Can't modify cancelled or rejected bookings
    if booking.status in [BookingStatus.CANCELLED, BookingStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Cannot modify cancelled or rejected bookings")

    # Check if modification is too close to start time (24-hour cutoff)
    can_cancel, msg = check_cancellation_allowed(booking)
    if not can_cancel:
        raise HTTPException(status_code=400, detail=msg)

    # Use existing times if not provided
    new_start = booking_data.start_time or booking.start_time
    new_end = booking_data.end_time or booking.end_time

    # Validate new times
    is_valid, error_msg = validate_booking_times(new_start, new_end)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Check for conflicts (excluding this booking)
    has_conflict, conflicts = check_booking_conflict(
        booking.facility_id,
        new_start,
        new_end,
        db,
        exclude_booking_id=booking_id,
    )
    if has_conflict:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Booking conflict detected with new times",
                "conflicts": conflicts,
            }
        )

    # Update booking
    if booking_data.start_time:
        booking.start_time = booking_data.start_time
    if booking_data.end_time:
        booking.end_time = booking_data.end_time
    if booking_data.notes is not None:
        booking.notes = booking_data.notes

    db.commit()
    db.refresh(booking)
    return booking


# ─────── DELETE: Cancel Booking ───────
@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Cancel a booking. Only the booking owner or admin can cancel.
    Cannot cancel within 24 hours of start time.
    """

    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Access control
    if (
        current_user.role != UserRole.ADMIN
        and booking.user_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this booking")

    # Check if cancellation is allowed
    can_cancel, msg = check_cancellation_allowed(booking)
    if not can_cancel:
        raise HTTPException(status_code=400, detail=msg)

    # Mark as cancelled rather than deleting
    booking.status = BookingStatus.CANCELLED
    db.commit()

    return {"message": "Booking cancelled successfully"}


# ─────── GET: Check Facility Availability ───────
@router.get("/facility/{facility_id}/availability")
def check_facility_availability(
    facility_id: int,
    date: str = Query(...),  # Format: "YYYY-MM-DD"
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get facility availability for a specific date.
    Returns occupied slots and availability status.
    """

    facility = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    availability = get_facility_availability(facility_id, target_date, db)
    return availability


# ─────── GET: Check Conflict ───────
@router.post("/check-conflict", response_model=schemas.BookingConflictResponse)
def check_conflict(
    facility_id: int = Query(...),
    start_time: datetime = Query(...),
    end_time: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Check for booking conflicts without creating a booking.
    Used for real-time conflict detection in frontend.
    """

    has_conflict, conflicts = check_booking_conflict(
        facility_id,
        start_time,
        end_time,
        db,
    )

    return schemas.BookingConflictResponse(
        has_conflict=has_conflict,
        conflicts=[
            schemas.ConflictInfo(**c)
            for c in conflicts
        ]
    )

