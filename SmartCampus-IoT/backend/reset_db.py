import os
import sys

# Add current directory to path
sys.path.append('.')

from app.database import engine, Base
from app import models

def reset_db():
    # Delete existing database file
    db_path = 'smartcampus.db'
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")

    # Create all tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database reset complete!")
    print("Tables created:", list(Base.metadata.tables.keys()))

if __name__ == "__main__":
    reset_db()