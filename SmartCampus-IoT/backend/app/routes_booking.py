"""
Booking Management Routes
Handles facility bookings, availability checks, and conflict detection
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
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
    process_hostel_booking  
)
import uuid

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])



def require_admin(user):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")



@router.get("/", response_model=list[schemas.BookingResponse])
def list_user_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    return db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id
    ).all()



@router.get("/{booking_id}", response_model=schemas.BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role not in [
        UserRole.ADMIN,
        UserRole.FACILITY_MANAGER,
    ]:
        raise HTTPException(status_code=403, detail="Not authorized")

    return booking



@router.post("/", response_model=schemas.BookingResponse, status_code=201)
def create_booking(
    booking_data: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    Check facility
    facility = db.query(models.Facility).filter(
        models.Facility.id == booking_data.facility_id
    ).first()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

   HOSTEL BOOKING LOGIC
    if facility.type == models.FacilityType.HOSTEL:
        result = process_hostel_booking(
            user_id=current_user.id,
            facility_id=facility.id,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            db=db
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])

        booking = db.query(models.Booking).filter(
            models.Booking.id == result["booking_id"]
        ).first()

        return booking

    

    Validate time
    is_valid, error_msg = validate_booking_times(
        booking_data.start_time,
        booking_data.end_time
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    Conflict check
    has_conflict, conflicts = check_booking_conflict(
        facility.id,
        booking_data.start_time,
        booking_data.end_time,
        db
    )

    if has_conflict:
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict detected", "conflicts": conflicts}
        )

    Status decide
    booking_status = (
        BookingStatus.PENDING
        if facility.requires_approval
        else BookingStatus.CONFIRMED
    )

    booking = models.Booking(
        facility_id=facility.id,
        user_id=current_user.id,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        status=booking_status,
        notes=booking_data.notes,
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    Approval record
    if facility.requires_approval:
        approval = models.BookingApproval(
            booking_id=booking.id,
            status=ApprovalStatus.PENDING,
        )
        db.add(approval)
        db.commit()

    return booking



@router.put("/{booking_id}", response_model=schemas.BookingResponse)
def update_booking(
    booking_id: int,
    booking_data: schemas.BookingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    Check cancellation window
    can_cancel, msg = check_cancellation_allowed(booking)
    if not can_cancel:
        raise HTTPException(status_code=400, detail=msg)

    new_start = booking_data.start_time or booking.start_time
    new_end = booking_data.end_time or booking.end_time

     Validate
    is_valid, error_msg = validate_booking_times(new_start, new_end)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

     Conflict check
    has_conflict, conflicts = check_booking_conflict(
        booking.facility_id,
        new_start,
        new_end,
        db,
        exclude_booking_id=booking.id
    )

    if has_conflict:
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict detected", "conflicts": conflicts}
        )

    booking.start_time = new_start
    booking.end_time = new_end
    booking.notes = booking_data.notes

    db.commit()
    db.refresh(booking)

    return booking



@router.delete("/{booking_id}")
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    can_cancel, msg = check_cancellation_allowed(booking)
    if not can_cancel:
        raise HTTPException(status_code=400, detail=msg)

    booking.status = BookingStatus.CANCELLED
    db.commit()

    return {"message": "Booking cancelled successfully"}



@router.get("/facility/{facility_id}/availability")
def check_availability(
    facility_id: int,
    date: str = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
    except:
        raise HTTPException(status_code=400, detail="Invalid date format")

    return get_facility_availability(facility_id, target_date, db)
