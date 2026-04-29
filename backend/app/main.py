from fastapi import FastAPI
from app.database import Base, engine
import app.routes as routes

Base.metadata.create_all(bind=engine)

#Step 1: Create app
app = FastAPI()

#Step 2: Create tables
Base.metadata.create_all(bind=engine)


#Step 3: Include routers
app.include_router(routes.auth.router)
app.include_router(routes.facility.router)
app.include_router(routes.booking.router)

app.include_router(routes.iot.router)

app.include_router(routes.iot.router)
app.include_router(routes.manager.router)

