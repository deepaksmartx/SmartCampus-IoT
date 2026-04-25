from app.models import FailedBooking
from datetime import datetime

def log_failed_booking(db, user_id, facility_id, facility_name, reason, start_time=None, end_time=None):
    record = FailedBooking(
        user_id=user_id,
        facility_id=facility_id,
        facility_name=facility_name,
        reason=reason,
        start_time=start_time,
        end_time=end_time
    )

    db.add(record)
    db.commit()