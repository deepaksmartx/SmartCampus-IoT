from sqlalchemy import inspect
from app.database import engine  # adjust import if needed

inspector = inspect(engine)
tables = inspector.get_table_names()
print("Tables in the database:", tables)