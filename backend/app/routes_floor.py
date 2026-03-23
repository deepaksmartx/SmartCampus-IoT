from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app import models, schemas
from app.auth import verify_token
from app.models import UserRole

router = APIRouter(prefix="/floors", tags=["Floors"])


# Role checks
def require_admin(user):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")


# CREATE
@router.post("/", response_model=schemas.FloorResponse)
def create_floor(floor: schemas.FloorCreate, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Create a new floor in a building.
    Requires: Admin role
    """
    require_admin(user)
    
    # Verify building exists
    building = db.query(models.Building).filter(models.Building.id == floor.building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    new_floor = models.Floor(floor_no=floor.floor_no, building_id=floor.building_id)
    db.add(new_floor)
    db.commit()
    db.refresh(new_floor)
    return new_floor


# GET ALL
@router.get("/", response_model=list[schemas.FloorResponse])
def get_all_floors(db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Retrieve all floors.
    Requires: Valid authentication
    """
    return db.query(models.Floor).all()


# GET BY BUILDING
@router.get("/building/{building_id}", response_model=list[schemas.FloorResponse])
def get_floors_by_building(building_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Retrieve all floors for a specific building.
    Requires: Valid authentication
    """
    # Verify building exists
    building = db.query(models.Building).filter(models.Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    floors = db.query(models.Floor).filter(models.Floor.building_id == building_id).all()
    return floors


# GET BY ID
@router.get("/{floor_id}", response_model=schemas.FloorResponse)
def get_floor(floor_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Retrieve a specific floor by ID.
    Requires: Valid authentication
    """
    floor = db.query(models.Floor).filter(models.Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")
    return floor


# UPDATE
@router.put("/{floor_id}", response_model=schemas.FloorResponse)
def update_floor(floor_id: int, updated: schemas.FloorUpdate, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Update a floor's details.
    Requires: Admin or Facility Manager role
    """
    require_admin_or_manager(user)

    floor = db.query(models.Floor).filter(models.Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    # If updating building_id, verify the new building exists
    if updated.building_id is not None:
        building = db.query(models.Building).filter(models.Building.id == updated.building_id).first()
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")
        floor.building_id = updated.building_id

    if updated.floor_no is not None:
        floor.floor_no = updated.floor_no

    db.commit()
    db.refresh(floor)
    return floor


# DELETE
@router.delete("/{floor_id}")
def delete_floor(floor_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Delete a floor.
    Requires: Admin role
    """
    require_admin(user)

    floor = db.query(models.Floor).filter(models.Floor.id == floor_id).first()
    if not floor:
        raise HTTPException(status_code=404, detail="Floor not found")

    try:
        db.delete(floor)
        db.commit()
        return {"message": "Floor deleted successfully"}
    except IntegrityError as e:
        db.rollback()
        # Check if it's a foreign key constraint error
        if "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=409, 
                detail="Cannot delete floor: it has associated rooms or other resources. Please delete those first."
            )
        raise HTTPException(status_code=400, detail="Cannot delete floor due to database constraints")
