from fastapi import Depends, HTTPException
from jose import jwt
from app.database import SessionLocal
from app.models.user import User

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"

def get_current_user(token: str, db=Depends(SessionLocal)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(User).get(payload["user_id"])
        return user
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_manager(user=Depends(get_current_user)):
    if user.role != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")
    return user
