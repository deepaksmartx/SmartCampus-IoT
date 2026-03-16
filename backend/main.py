from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models
from app import routes
from app.auth import create_access_token

app = FastAPI(title="Backend API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup (optional — prefer using init_db.py manually)
# Base.metadata.create_all(bind=engine)

# Root route
@app.get("/")
def read_root():
    return {
        "message": "Welcome to SmartCampus Backend API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "users": "/users"
        }
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Test endpoint to generate JWT token (remove in production)
@app.get("/test-token/{user_id}")
def get_test_token(user_id: int):
    """
    Generate a test JWT token for testing endpoints (REMOVE IN PRODUCTION).
    Use the returned token in the Authorization header: Bearer <token>
    """
    token = create_access_token(user_id=user_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "instructions": "Add this to your request header: Authorization: Bearer <token>",
        "user_id": user_id
    }

# Include routers
app.include_router(routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
