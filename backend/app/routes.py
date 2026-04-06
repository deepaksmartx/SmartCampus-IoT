from email import message
import random
from urllib import response
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from . import models
from . import schemas
from .database import get_db
from .auth import verify_token
from .auth import create_access_token
import hashlib
from .thingsboard_service import send_dashboard_data

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/profile", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(verify_token)):
    """
    Fetch current authenticated user's profile
    
    Requires: Valid JWT token in Authorization header
    """
    return current_user

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user_by_id(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(verify_token)):
    """
    Fetch user profile by user ID
    
    Requires: Valid JWT token in Authorization header
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    return user

@router.get("/email/{email}", response_model=schemas.UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db), current_user: models.User = Depends(verify_token)):
    """
    Fetch user profile by email
    
    Requires: Valid JWT token in Authorization header
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {email} not found"
        )
    
    return user

@router.post("/register")
def register_user(user: schemas.UserRegister, db: Session = Depends(get_db)):

    # check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        phone_number=user.phone_number
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}



@router.post("/login", response_model=schemas.TokenResponse)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    hashed_input_password = hashlib.sha256(user.password.encode()).hexdigest()

    if hashed_input_password != db_user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(db_user.id)

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/dashboard/update")
def update_dashboard(
    device_type: str = Query(..., description="occupancy / water / energy"),
    facility_type: str = Query(..., description="Hostel / Lab / Campus"),
    facility_name: str = Query(..., description="Room name or building")
):
    status, response = send_dashboard_data(
        device_type,
        facility_type,
        facility_name
    )

    message = (
    f"{device_type} device updated successfully"
    if status == 200
    else f"{device_type} device update failed"
    )

    return {
    "message": message,
    "status_code": status,
    "response": response
    }
