import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# Ensure sqlite target directory exists if file-based database path is specified
if "sqlite" in settings.DATABASE_URL:
    db_file = settings.DATABASE_URL.replace("sqlite:////", "/").replace("sqlite:///", "").replace("sqlite://", "")
    if db_file and db_file != ":memory:":
        db_dir = os.path.dirname(os.path.abspath(db_file))
        try:
            os.makedirs(db_dir, exist_ok=True)
        except Exception:
            pass

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 45})

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()
    except Exception:
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

_db_initialized = False

def init_db():
    global _db_initialized
    import app.models  # noqa: F401
    try:
        Base.metadata.create_all(bind=engine)
        _db_initialized = True
    except Exception as exc:
        import logging
        logging.getLogger("taskpilot.api").error(f"Database initialization error: {exc}")

def get_db():
    global _db_initialized
    if not _db_initialized:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()