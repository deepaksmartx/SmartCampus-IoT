from pathlib import Path

path = Path('app/booking_logic.py')
text = path.read_text(encoding='utf-8')
needle = '''    if end_time - start_time < timedelta(minutes=30):
        return False, "Minimum booking duration is 30 minutes"

    return True, ""


def check_booking_conflict(facility_id, start_time, end_time, db: Session):'''
if needle not in text:
    raise SystemExit('needle not found')

replacement = '''    if end_time - start_time < timedelta(minutes=30):
        return False, "Minimum booking duration is 30 minutes"

    return True, ""


def check_cancellation_allowed(booking, cancellation_cutoff_hours: int = 24):
    now = datetime.now(timezone.utc)
    time_until_start = booking.start_time - now
    cutoff_delta = timedelta(hours=cancellation_cutoff_hours)

    if time_until_start < cutoff_delta:
        hours_left = time_until_start.total_seconds() / 3600
        return False, f"Cannot cancel within {cancellation_cutoff_hours} hours of start. {hours_left:.1f} hours remaining."

    return True, ""


def check_booking_conflict(facility_id, start_time, end_time, db: Session):'''

path.write_text(text.replace(needle, replacement), encoding='utf-8')
print('patched')
