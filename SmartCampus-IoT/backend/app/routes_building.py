from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app import models, schemas
from app.auth import verify_token
from app.models import UserRole

router = APIRouter(prefix="/buildings", tags=["Buildings"])


# Role checks
def require_admin(user):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")


# CREATE
@router.post("/", response_model=schemas.BuildingResponse)
def create_building(building: schemas.BuildingCreate, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Create a new building under a campus.
    Requires: Admin role
    """
    require_admin(user)
    
    # Verify campus exists
    campus = db.query(models.Campus).filter(models.Campus.id == building.campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    new_building = models.Building(name=building.name, campus_id=building.campus_id)
    db.add(new_building)
    db.commit()
    db.refresh(new_building)
    return new_building


# GET ALL
@router.get("/", response_model=list[schemas.BuildingResponse])
def get_all_buildings(db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Retrieve all buildings.
    Requires: Valid authentication
    """
    return db.query(models.Building).all()


# GET BY CAMPUS
@router.get("/campus/{campus_id}", response_model=list[schemas.BuildingResponse])
def get_buildings_by_campus(campus_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Retrieve all buildings for a specific campus.
    Requires: Valid authentication
    """
    # Verify campus exists
    campus = db.query(models.Campus).filter(models.Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(status_code=404, detail="Campus not found")
    
    buildings = db.query(models.Building).filter(models.Building.campus_id == campus_id).all()
    return buildings


# GET BY ID
@router.get("/{building_id}", response_model=schemas.BuildingResponse)
def get_building(building_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Retrieve a specific building by ID.
    Requires: Valid authentication
    """
    building = db.query(models.Building).filter(models.Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return building


# UPDATE
@router.put("/{building_id}", response_model=schemas.BuildingResponse)
def update_building(building_id: int, updated: schemas.BuildingUpdate, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Update a building's details.
    Requires: Admin or Facility Manager role
    """
    require_admin_or_manager(user)

    building = db.query(models.Building).filter(models.Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    # If updating campus_id, verify the new campus exists
    if updated.campus_id is not None:
        campus = db.query(models.Campus).filter(models.Campus.id == updated.campus_id).first()
        if not campus:
            raise HTTPException(status_code=404, detail="Campus not found")
        building.campus_id = updated.campus_id

    if updated.name is not None:
        building.name = updated.name

    db.commit()
    db.refresh(building)
    return building


# DELETE
@router.delete("/{building_id}")
def delete_building(building_id: int, db: Session = Depends(get_db), user=Depends(verify_token)):
    """
    Delete a building.
    Requires: Admin role
    """
    require_admin(user)

    building = db.query(models.Building).filter(models.Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    try:
        db.delete(building)
        db.commit()
        return {"message": "Building deleted successfully"}
    except IntegrityError as e:
        db.rollback()
        # Check if it's a foreign key constraint error
        if "foreign key" in str(e).lower():
            raise HTTPException(
                status_code=409, 
                detail="Cannot delete building: it has associated floors or other resources. Please delete those first."
            )
        raise HTTPException(status_code=400, detail="Cannot delete building due to database constraints")
