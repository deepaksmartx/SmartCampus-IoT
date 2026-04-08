from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app import models, routes
from app.auth import create_access_token, verify_token
from app.routes_facility import router as facility_router, facilities_router
from app.routes_building import router as building_router
from app.routes_floor import router as floor_router
from app.routes_booking import router as booking_router
from app.routes_approval import router as approval_router
from app.routes_iot import router as iot_router
import hashlib

app = FastAPI(title="Backend API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create tables on startup (optional — prefer using init_db.py manually)
Base.metadata.create_all(bind=engine)

@app.post("/login", tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Handle user login. OAuth2 standard:
    - 'username' field captures the email
    - 'password' field captures the password
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    hashed_password = hashlib.sha256(form_data.password.encode()).hexdigest()
    if not user or user.hashed_password != hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token(user_id=user.id)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", tags=["Authentication"])
def get_current_user_profile(current_user: models.User = Depends(verify_token)):
    """
    An extra endpoint to prove your JWT verification works.
    Only accessible with a valid token.
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }


@app.get("/")
def read_root():
    return {
        "message": "Welcome to SmartCampus Backend API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "users": "/users",
            "login": "/login"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/test-token/{user_id}")
def get_test_token(user_id: int):
    token = create_access_token(user_id=user_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "instructions": "Add this to your request header: Authorization: Bearer <token>",
        "user_id": user_id
    }

# Include routers
app.include_router(routes.router)
app.include_router(facility_router)
app.include_router(facilities_router)
app.include_router(building_router)
app.include_router(floor_router)
app.include_router(booking_router)
app.include_router(approval_router)
app.include_router(iot_router)

if __name__ == "__main__":
    import uvicorn
    # Finalized the port as 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)

