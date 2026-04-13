from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models, schemas
from app.auth import verify_token
from app.models import UserRole, FacilityType

router = APIRouter(prefix="/campus", tags=["Campus"])
facilities_router = APIRouter(prefix="/api/facilities", tags=["Facilities"])


# Role checks
def require_admin(user):
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")


def require_admin_or_manager(user):
    if user.role not in [UserRole.ADMIN, UserRole.FACILITY_MANAGER]:
        raise HTTPException(status_code=403, detail="Admin or Facility Manager required")


def ensure_manager_access(user, facility):
    if user.role == UserRole.ADMIN:
        return
    if facility.manager_id != user.id:
        raise HTTPException(status_code=403, detail="Facility manager can only access assigned facilities")


# ═══════ CAMPUS ROUTES ═══════
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


# ═══════ FACILITY ROUTES ═══════

# POST: Create Facility
@facilities_router.post("/", response_model=schemas.FacilityResponse, status_code=201)
def create_facility(
    facility_data: schemas.FacilityCreate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """Create a new facility. Admin and facility manager."""
    require_admin_or_manager(user)

    # Verify building exists
    building = db.query(models.Building).filter(
        models.Building.id == facility_data.building_id
    ).first()
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    # Verify floor exists if provided
    if facility_data.floor_id:
        floor = db.query(models.Floor).filter(
            models.Floor.id == facility_data.floor_id
        ).first()
        if not floor:
            raise HTTPException(status_code=404, detail="Floor not found")

    if facility_data.type == FacilityType.CUSTOM and not facility_data.custom_type:
        raise HTTPException(status_code=400, detail="custom_type is required for Custom facility type")

    manager_id = facility_data.manager_id
    if user.role == UserRole.FACILITY_MANAGER:
        manager_id = user.id
    elif manager_id:
        manager = db.query(models.User).filter(models.User.id == manager_id).first()
        if not manager or manager.role != UserRole.FACILITY_MANAGER:
            raise HTTPException(status_code=400, detail="manager_id must belong to a facility manager")

    new_facility = models.Facility(
        name=facility_data.name,
        type=facility_data.type,
        subtype=facility_data.subtype,
        custom_type=facility_data.custom_type,
        building_id=facility_data.building_id,
        floor_id=facility_data.floor_id,
        capacity=facility_data.capacity,
        requires_approval=facility_data.requires_approval,
        sensor_id=facility_data.sensor_id,
        manager_id=manager_id,
        description=facility_data.description,
    )
    db.add(new_facility)
    db.commit()
    db.refresh(new_facility)
    return new_facility


# GET: List All Facilities
@facilities_router.get("/", response_model=list[schemas.FacilityResponse])
def list_facilities(
    facility_type: str = Query(None),
    building_id: int = Query(None),
    floor_id: int = Query(None),
    min_capacity: int = Query(None),
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """Get all facilities with optional filters."""
    query = db.query(models.Facility)

    if facility_type:
        try:
            ftype = FacilityType[facility_type.upper()]
            query = query.filter(models.Facility.type == ftype)
        except KeyError:
            raise HTTPException(status_code=400, detail="Invalid facility type")

    if building_id:
        query = query.filter(models.Facility.building_id == building_id)

    if floor_id:
        query = query.filter(models.Facility.floor_id == floor_id)

    if min_capacity:
        query = query.filter(models.Facility.capacity >= min_capacity)

    if user.role == UserRole.FACILITY_MANAGER:
        # Show both manager-owned and unassigned facilities so managers are never blocked by empty state.
        query = query.filter(
            or_(models.Facility.manager_id == user.id, models.Facility.manager_id.is_(None))
        )

    facilities = query.order_by(models.Facility.name).all()
    return facilities


# GET: Single Facility
@facilities_router.get("/{facility_id}", response_model=schemas.FacilityResponse)
def get_facility(
    facility_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """Get facility details by ID."""
    facility = db.query(models.Facility).filter(
        models.Facility.id == facility_id
    ).first()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    return facility


# PUT: Update Facility
@facilities_router.put("/{facility_id}", response_model=schemas.FacilityResponse)
def update_facility(
    facility_id: int,
    facility_data: schemas.FacilityUpdate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """Update facility details. Admin or assigned manager."""
    require_admin_or_manager(user)

    facility = db.query(models.Facility).filter(
        models.Facility.id == facility_id
    ).first()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    ensure_manager_access(user, facility)

    # Verify building exists if updating
    if facility_data.building_id:
        building = db.query(models.Building).filter(
            models.Building.id == facility_data.building_id
        ).first()
        if not building:
            raise HTTPException(status_code=404, detail="Building not found")

    # Verify floor exists if updating
    if facility_data.floor_id:
        floor = db.query(models.Floor).filter(
            models.Floor.id == facility_data.floor_id
        ).first()
        if not floor:
            raise HTTPException(status_code=404, detail="Floor not found")

    if facility_data.type == FacilityType.CUSTOM and not facility_data.custom_type:
        raise HTTPException(status_code=400, detail="custom_type is required for Custom facility type")

    # Update fields
    if facility_data.name is not None:
        facility.name = facility_data.name
    if facility_data.type is not None:
        facility.type = facility_data.type
    if facility_data.subtype is not None:
        facility.subtype = facility_data.subtype
    if facility_data.custom_type is not None:
        facility.custom_type = facility_data.custom_type
    if facility_data.building_id is not None:
        facility.building_id = facility_data.building_id
    if facility_data.floor_id is not None:
        facility.floor_id = facility_data.floor_id
    if facility_data.capacity is not None:
        facility.capacity = facility_data.capacity
    if facility_data.requires_approval is not None:
        facility.requires_approval = facility_data.requires_approval
    if facility_data.sensor_id is not None:
        facility.sensor_id = facility_data.sensor_id
    if facility_data.manager_id is not None and user.role == UserRole.ADMIN:
        manager = db.query(models.User).filter(models.User.id == facility_data.manager_id).first()
        if not manager or manager.role != UserRole.FACILITY_MANAGER:
            raise HTTPException(status_code=400, detail="manager_id must belong to a facility manager")
        facility.manager_id = facility_data.manager_id
    if facility_data.description is not None:
        facility.description = facility_data.description

    db.commit()
    db.refresh(facility)
    return facility


# DELETE: Delete Facility
@facilities_router.delete("/{facility_id}")
def delete_facility(
    facility_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    """Delete a facility. Admin or assigned manager. Cannot delete if there are active bookings."""
    require_admin_or_manager(user)

    facility = db.query(models.Facility).filter(
        models.Facility.id == facility_id
    ).first()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    ensure_manager_access(user, facility)

    # Check for active bookings
    active_bookings = db.query(models.Booking).filter(
        models.Booking.facility_id == facility_id,
        models.Booking.status.in_([models.BookingStatus.PENDING, models.BookingStatus.CONFIRMED])
    ).count()

    if active_bookings > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete facility with {active_bookings} active bookings",
        )

    db.delete(facility)
    db.commit()
    return {"message": "Facility deleted successfully"}


# GET: Facility Type Options
@facilities_router.get("/config/facility-types")
def get_facility_types():
    """Get list of available facility types."""
    return {
        "facility_types": [ftype.value for ftype in FacilityType],
        "allow_custom": True,
        "subtypes": {
            "Hostel": ["Student Room", "Guest Room"],
            "Sports": ["Indoor", "Outdoor", "Gym"],
            "Dining": ["Cafeteria", "Mess", "Food Court"],
            "Bus": ["Shuttle", "Intercity", "Staff"]
        }
    }


@facilities_router.post("/inventory", response_model=schemas.InventoryResponse, status_code=201)
def create_inventory_item(
    payload: schemas.InventoryCreate,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    require_admin_or_manager(user)
    facility = db.query(models.Facility).filter(models.Facility.id == payload.facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    ensure_manager_access(user, facility)

    item = models.FacilityInventory(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@facilities_router.get("/{facility_id}/inventory", response_model=list[schemas.InventoryResponse])
def list_inventory_items(
    facility_id: int,
    db: Session = Depends(get_db),
    user=Depends(verify_token),
):
    require_admin_or_manager(user)
    facility = db.query(models.Facility).filter(models.Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    ensure_manager_access(user, facility)

    return db.query(models.FacilityInventory).filter(models.FacilityInventory.facility_id == facility_id).all()