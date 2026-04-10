from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)  # temperature, occupancy, etc.
    facility_id = Column(Integer, ForeignKey("facilities.id"))
    topic = Column(String)  # MQTT topic
