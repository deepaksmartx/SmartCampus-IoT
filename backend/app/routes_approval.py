"""
Booking Approval Workflow Routes
Handles approval and rejection of pending bookings by managers
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_token
from app.models import UserRole, BookingStatus, ApprovalStatus

router = APIRouter(prefix="/api/admin", tags=["Approvals"])


# ─────── Role Helpers ───────
def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")


# ─────── GET: List Pending Approvals ───────
@router.get("/pending-approvals", response_model=list[schemas.BookingResponse])
def get_pending_approvals(
    facility_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get all pending booking approvals.
    Managers see only their facilities; admins see all.
    """
    require_admin_or_manager(current_user)

    # Query for bookings pending approval
    query = db.query(models.Booking).filter(
        models.Booking.status == BookingStatus.PENDING
    )

    # Managers see only their assigned facilities
    if current_user.role == UserRole.FACILITY_MANAGER:
        query = query.join(models.Facility, models.Facility.id == models.Booking.facility_id).filter(
            models.Facility.manager_id == current_user.id
        )

    if facility_id:
        query = query.filter(models.Booking.facility_id == facility_id)

    bookings = query.order_by(models.Booking.created_at.desc()).all()
    return bookings


@router.get("/pending-approvals/count")
def count_pending_approvals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get count of pending approvals for dashboard stats.
    """
    require_admin_or_manager(current_user)

    count = db.query(models.Booking).filter(
        models.Booking.status == BookingStatus.PENDING
    )
    if current_user.role == UserRole.FACILITY_MANAGER:
        count = count.join(models.Facility, models.Facility.id == models.Booking.facility_id).filter(
            models.Facility.manager_id == current_user.id
        )
    count = count.count()

    return {"pending_count": count}


# ─────── POST: Approve Booking ───────
@router.post("/bookings/{booking_id}/approve", response_model=schemas.BookingResponse)
def approve_booking(
    booking_id: int,
    approval_data: schemas.BookingApprovalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Approve a pending booking.
    Changes status from PENDING to CONFIRMED.
    Creates/updates approval record.
    """
    require_admin_or_manager(current_user)

    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve booking with status: {booking.status}",
        )

    # Update booking status
    booking.status = BookingStatus.CONFIRMED

    # Update or create approval record
    approval = db.query(models.BookingApproval).filter(
        models.BookingApproval.booking_id == booking_id
    ).first()

    if approval:
        approval.status = ApprovalStatus.APPROVED
        approval.approver_id = current_user.id
        approval.reason = approval_data.reason
    else:
        approval = models.BookingApproval(
            booking_id=booking_id,
            approver_id=current_user.id,
            status=ApprovalStatus.APPROVED,
            reason=approval_data.reason,
        )
        db.add(approval)

    db.commit()
    db.refresh(booking)

    # TODO: Trigger notification to user that booking is approved
    # notification_service.send_approval_notification(booking)

    return booking


# ─────── POST: Reject Booking ───────
@router.post("/bookings/{booking_id}/reject", response_model=schemas.BookingResponse)
def reject_booking(
    booking_id: int,
    approval_data: schemas.BookingApprovalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Reject a pending booking.
    Changes status from PENDING to REJECTED.
    Creates/updates approval record with rejection reason.
    """
    require_admin_or_manager(current_user)

    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot reject booking with status: {booking.status}",
        )

    # Update booking status
    booking.status = BookingStatus.REJECTED

    # Update or create approval record
    approval = db.query(models.BookingApproval).filter(
        models.BookingApproval.booking_id == booking_id
    ).first()

    if approval:
        approval.status = ApprovalStatus.REJECTED
        approval.approver_id = current_user.id
        approval.reason = approval_data.reason
    else:
        approval = models.BookingApproval(
            booking_id=booking_id,
            approver_id=current_user.id,
            status=ApprovalStatus.REJECTED,
            reason=approval_data.reason,
        )
        db.add(approval)

    db.commit()
    db.refresh(booking)

    # TODO: Trigger notification to user that booking is rejected
    # notification_service.send_rejection_notification(booking, approval.reason)

    return booking


# ─────── GET: Get Booking Approval Details ───────
@router.get("/bookings/{booking_id}/approval", response_model=schemas.BookingApprovalResponse)
def get_booking_approval(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get approval details for a booking.
    """
    approval = db.query(models.BookingApproval).filter(
        models.BookingApproval.booking_id == booking_id
    ).first()

    if not approval:
        raise HTTPException(status_code=404, detail="Approval record not found")

    return approval


# ─────── GET: List Approvals by Status ───────
@router.get("/approvals/by-status", response_model=list[schemas.BookingApprovalResponse])
def list_approvals_by_status(
    status: str = Query(...),  # pending, approved, rejected
    facility_id: int = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(verify_token),
):
    """
    Get all approvals filtered by status.
    """
    require_admin_or_manager(current_user)

    try:
        approval_status = ApprovalStatus[status.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid approval status")

    query = db.query(models.BookingApproval).filter(
        models.BookingApproval.status == approval_status
    )

    if facility_id:
        # Join with Booking to filter by facility
        query = query.join(models.Booking).filter(
            models.Booking.facility_id == facility_id
        )

    approvals = query.order_by(models.BookingApproval.created_at.desc()).all()
    return approvals
