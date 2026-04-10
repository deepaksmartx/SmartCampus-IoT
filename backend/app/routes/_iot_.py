from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.device import Device
from app.models.sensor_data import SensorData

router = APIRouter(prefix="/iot")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 Register device
@router.post("/devices")
def create_device(name: str, type: str, facility_id: int, topic: str, db: Session = Depends(get_db)):
    device = Device(name=name, type=type, facility_id=facility_id, topic=topic)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

# 🔹 Get devices
@router.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    return db.query(Device).all()

# 🔹 Receive sensor data (from MQTT or API)
@router.post("/data")
def receive_data(device_id: int, value: float, db: Session = Depends(get_db)):
    data = SensorData(device_id=device_id, value=value)
    db.add(data)
    db.commit()
    return {"message": "Data stored"}

# 🔹 Get latest data for dashboard
@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return db.query(SensorData).order_by(SensorData.timestamp.desc()).limit(20).all()
