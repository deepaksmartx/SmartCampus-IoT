from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.facility import Facility

router = APIRouter(prefix="/facilities")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def create_facility(name: str, type: str, capacity: int, requires_approval: bool = False, db: Session = Depends(get_db)):
    facility = Facility(
        name=name,
        type=type,
        capacity=capacity,
        requires_approval=requires_approval
    )

    db.add(facility)
    db.commit()
    db.refresh(facility)

    return facility

@router.get("/")
def get_facilities(db: Session = Depends(get_db)):
    return db.query(Facility).all()
