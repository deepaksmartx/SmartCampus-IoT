from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    capacity = Column(Integer)
    requires_approval = Column(Boolean, default=False)

    manager_id = Column(Integer, ForeignKey("users.id"))  
