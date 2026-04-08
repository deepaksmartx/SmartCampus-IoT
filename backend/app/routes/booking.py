from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models.booking import Booking
from app.models.facility import Facility

router = APIRouter(prefix="/bookings")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_conflict(db, facility_id, start, end):
    return db.query(Booking).filter(
        Booking.facility_id == facility_id,
        Booking.start_time < end,
        Booking.end_time > start,
        Booking.status != "cancelled"
    ).first()

@router.post("/")
def create_booking(facility_id: int, user_id: int, start: datetime, end: datetime, db: Session = Depends(get_db)):
    if check_conflict(db, facility_id, start, end):
        raise HTTPException(status_code=409, detail="Slot already booked")

    facility = db.query(Facility).filter(Facility.id == facility_id).first()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    status = "pending" if facility.requires_approval else "confirmed"

    booking = Booking(
        facility_id=facility_id,
        user_id=user_id,
        start_time=start,
        end_time=end,
        status=status
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking

@router.delete("/{id}")
def cancel_booking(id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).get(id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "cancelled"
    db.commit()

    return {"message": "Booking cancelled"}

@router.post("/approve/{id}")
def approve_booking(id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).get(id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = "confirmed"
    db.commit()

    return {"message": "Booking approved"}
