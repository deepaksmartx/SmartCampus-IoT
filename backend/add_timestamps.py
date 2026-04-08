# Add created_at and updated_at columns to buildings table
from app.database import engine
from sqlalchemy import text

def add_timestamps():
    print("Adding timestamps to buildings table...")
    
    with engine.begin() as connection:
        try:
            # Add created_at column
            connection.execute(text("""
                ALTER TABLE buildings 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            """))
            print("✅ Added created_at column")
            
            # Add updated_at column
            connection.execute(text("""
                ALTER TABLE buildings 
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            """))
            print("✅ Added updated_at column")
            
            print("✅ Timestamps added successfully!")
        except Exception as e:
            print(f"❌ Error adding timestamps: {e}")

if __name__ == "__main__":
    add_timestamps()
