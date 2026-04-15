from fastapi import FastAPI
from app.database import Base, engine
from app.routes import auth, facility, booking, iot, manager


Step 1: Create app
app = FastAPI()

Step 2: Create tables
Base.metadata.create_all(bind=engine)


Step 3: Include routers
app.include_router(auth.router)
app.include_router(facility.router)
app.include_router(booking.router)
app.include_router(iot.router)
app.include_router(manager.router)

