from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False, "timeout": 45})

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)


#                 Backend Starts
#                        │
#                        ▼
#                  init_db()
#                        │
#                        ▼
#               Load All Models
#                        │
#                        ▼
#          Base.metadata.create_all()
#                        │
#                        ▼
#             SQLite Tables Ready
#                        │
# ──────────────────────────────────────────
# User sends API Request
#                        │
#                        ▼
#                   get_db()
#                        │
#                        ▼
#                Create Session
#                        │
#                        ▼
#              Perform DB Operations
#                        │
#                        ▼
#                  db.commit()
#                        │
#                        ▼
#                  Close Session