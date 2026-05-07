import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.append('.')

# Set up database URL
DATABASE_URL = f"sqlite:///{Path(__file__).resolve().parent / 'smartcampus.db'}"
print(f"Using database URL: {DATABASE_URL}")

# Create engine and base
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base
engine = create_engine(DATABASE_URL)
Base = declarative_base()

# Import models to register them
from app import models

print("Dropping all existing tables...")
metadata = MetaData()
metadata.reflect(bind=engine)
metadata.drop_all(bind=engine)
print("✅ All tables dropped")

print("Creating tables with correct schema...")
Base.metadata.create_all(bind=engine)
print("✅ Database recreated successfully!")
print("Tables created:", list(Base.metadata.tables.keys()))

# Verify the users table has the gender column
from sqlalchemy import inspect
inspector = inspect(engine)
users_columns = [col['name'] for col in inspector.get_columns('users')]
print("Users table columns:", users_columns)

if 'gender' in users_columns:
    print("✅ Gender column found - schema is correct!")
else:
    print("❌ Gender column missing - schema issue persists")