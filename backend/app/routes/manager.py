from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.booking import Booking
from app.models.facility import Facility
from app.core.dependencies import require_manager

router = APIRouter(prefix="/manager")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 Get bookings for manager’s facilities
@router.get("/bookings")
def get_manager_bookings(user=Depends(require_manager), db: Session = Depends(get_db)):
    facilities = db.query(Facility).filter(Facility.manager_id == user.id).all()

    facility_ids = [f.id for f in facilities]

    bookings = db.query(Booking).filter(Booking.facility_id.in_(facility_ids)).all()

    return bookings

# 🔹 Approve booking
@router.post("/approve/{booking_id}")
def approve_booking(booking_id: int, user=Depends(require_manager), db: Session = Depends(get_db)):
    booking = db.query(Booking).get(booking_id)

    facility = db.query(Facility).get(booking.facility_id)

    if facility.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Not your facility")

    booking.status = "confirmed"
    db.commit()

    return {"message": "Approved"}

# 🔹 Reject booking
@router.post("/reject/{booking_id}")
def reject_booking(booking_id: int, user=Depends(require_manager), db: Session = Depends(get_db)):
    booking = db.query(Booking).get(booking_id)

    facility = db.query(Facility).get(booking.facility_id)

    if facility.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Not your facility")

    booking.status = "rejected"
    db.commit()

    return {"message": "Rejected"}
