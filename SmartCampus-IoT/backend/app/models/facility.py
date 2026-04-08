from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base

class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    capacity = Column(Integer)
    requires_approval = Column(Boolean, default=False)
