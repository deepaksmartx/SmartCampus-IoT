from fastapi import APIRouter

import app.routes as routes
import app.routes_approval as routes_approval
import app.routes_booking as routes_booking
import app.routes_building as routes_building
import app.routes_facility as routes_facility
import app.routes_floor as routes_floor

# create central router
router = APIRouter()

# include all routers
router.include_router(routes.router)
router.include_router(routes_approval.router)
router.include_router(routes_booking.router)
router.include_router(routes_building.router)
router.include_router(routes_facility.router)
router.include_router(routes_facility.facilities_router)
router.include_router(routes_floor.router)