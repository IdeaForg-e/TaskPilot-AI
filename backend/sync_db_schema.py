import sqlite3
import os
import sys

# Ensure backend directory is in the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import Base
# Import models to ensure they are registered in Base.metadata
import app.models.daily_plan
import app.models.priority_score
import app.models.quality_report
import app.models.source_event
import app.models.task
import app.models.workflow_run

def sync_db(db_path):
    print(f"Syncing database: {db_path}")
    if not os.path.exists(db_path):
        print(f"Database {db_path} does not exist. Skipping.")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables in SQLite
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing_tables = [r[0] for r in cursor.fetchall()]
    
    # Loop over all models in metadata
    for table_name, table in Base.metadata.tables.items():
        if table_name not in existing_tables:
            print(f"Table {table_name} does not exist in {db_path}. Skipping.")
            continue
            
        # Get existing columns in SQLite table
        cursor.execute(f"PRAGMA table_info({table_name})")
        existing_cols = {r[1]: r[2] for r in cursor.fetchall()}
        
        # Check for missing columns
        for column in table.columns:
            col_name = column.name
            if col_name not in existing_cols:
                # Get SQLite type representation
                col_type = str(column.type).upper()
                if "VARCHAR" in col_type or "TEXT" in col_type or "JSON" in col_type:
                    sql_type = "TEXT"
                elif "FLOAT" in col_type:
                    sql_type = "FLOAT"
                elif "INTEGER" in col_type:
                    sql_type = "INTEGER"
                elif "BOOLEAN" in col_type:
                    sql_type = "BOOLEAN"
                elif "DATETIME" in col_type:
                    sql_type = "DATETIME"
                else:
                    sql_type = "TEXT"
                
                alter_query = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {sql_type}"
                print(f"Executing: {alter_query} on {db_path}")
                try:
                    cursor.execute(alter_query)
                    conn.commit()
                except Exception as e:
                    print(f"Error altering table {table_name}: {e}")
                    
    conn.close()

if __name__ == "__main__":
    # The root db relative to backend folder is ../taskpilot.db
    sync_db("../taskpilot.db")
    sync_db("taskpilot.db")
