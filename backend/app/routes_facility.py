from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_token
from app.models import UserRole

router = APIRouter(prefix="/campus", tags=["Campus"])


# Role checks
def require_admin(user):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")


# CREATE
@router.post("/", response_model=schemas.CampusResponse)
def create_campus(campus: schemas.CampusCreate, db: Session = Depends(get_db), user=Depends(verify_token)):
    require_admin(user)
    new_campus = models.Campus(name=campus.name)
    db.add(new_campus)
    db.commit()
    db.refresh(new_campus)
    return new_campus


# GET ALL
@router.get("/", response_model=list[schemas.CampusResponse])
def get_all_campuses(db: Session = Depends(get_db), user=Depends(verify_token)):
    return db.query(models.Campus).all()


# GET BY ID
@router.get("/{campus_id}", response_model=schemas.CampusResponse)
def get_campus(campus_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    campus = db.query(models.Campus).filter(models.Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    return campus


# UPDATE
@router.put("/{campus_id}", response_model=schemas.CampusResponse)
def update_campus(campus_id: int, updated: schemas.CampusCreate, db: Session = Depends(get_db), user=Depends(verify_token)):
    require_admin_or_manager(user)

    campus = db.query(models.Campus).filter(models.Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")

    campus.name = updated.name
    db.commit()
    db.refresh(campus)
    return campus


# DELETE
@router.delete("/{campus_id}")
def delete_campus(campus_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    require_admin(user)

    campus = db.query(models.Campus).filter(models.Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")

    db.delete(campus)
    db.commit()
    return {"message": "Campus deleted successfully"}