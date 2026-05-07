import sys
sys.path.append('.')

from app.database import SessionLocal
from app.models import User, UserRole
import hashlib

db = SessionLocal()

# Create a test user
hashed_password = hashlib.sha256("test".encode()).hexdigest()
test_user = User(
    name="Test User",
    email="test@example.com",
    phone_number="1234567890",
    role=UserRole.STUDENT,
    gender="male",
    hashed_password=hashed_password
)

db.add(test_user)
db.commit()
db.refresh(test_user)

print(f"✅ Test user created with ID: {test_user.id}")
print(f"Email: {test_user.email}")
print(f"Password: test")

db.close()