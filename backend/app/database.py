import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = postgresql://neondb_owner:npg_0OdUvLMPKRJ8@ep-polished-thunder-a1wx5sks-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

print("DEBUG DB URL:", DATABASE_URL)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
