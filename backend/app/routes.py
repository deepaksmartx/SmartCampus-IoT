from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from . import models
from . import schemas
from .database import get_db
from .auth import verify_token
import hashlib

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