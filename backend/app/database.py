import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from app.config import settings

logger = logging.getLogger("taskpilot.database")

def create_db_engine():
    url = settings.DATABASE_URL
    if "sqlite" in url and ":memory:" not in url:
        clean_path = url.replace("sqlite:////", "/").replace("sqlite:///", "")
        if not clean_path.startswith("/"):
            clean_path = "/" + clean_path
        db_dir = os.path.dirname(clean_path)
        if db_dir:
            try:
                os.makedirs(db_dir, exist_ok=True)
            except Exception as e:
                logger.warning(f"Could not create db directory {db_dir}: {e}")

    try:
        eng = create_engine(url, connect_args={"check_same_thread": False, "timeout": 45})
        with eng.connect() as conn:
            pass
        return eng
    except Exception as exc:
        logger.error(f"Failed to connect to SQLite at {url}: {exc}. Using in-memory fallback.")
        return create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

engine = create_db_engine()

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    try:
        cursor = dbapi_connection.cursor()
        if getattr(settings, "IS_SERVERLESS", False):
            cursor.execute("PRAGMA journal_mode=DELETE")
        else:
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
    global _db_initialized, engine, SessionLocal
    import app.models  # noqa: F401
    try:
        Base.metadata.create_all(bind=engine)
        _db_initialized = True
        seed_if_empty()
    except Exception as exc:
        logger.error(f"Database init_db error: {exc}. Retrying with in-memory SQLite.")
        try:
            engine = create_engine(
                "sqlite:///:memory:",
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            Base.metadata.create_all(bind=engine)
            _db_initialized = True
            seed_if_empty()
        except Exception as e:
            logger.error(f"In-memory database fallback failed: {e}")

def seed_if_empty():
    try:
        from app.models.task import MasterTask
        from app.services.agent_0_orchestrator_service import OrchestratorService
        db = SessionLocal()
        count = db.query(MasterTask).count()
        if count == 0:
            logger.info("Database is empty on startup. Auto-running pipeline to seed initial tasks...")
            orch = OrchestratorService(db)
            orch.run_full_pipeline()
        db.close()
    except Exception as e:
        logger.warning(f"Auto-seeding pipeline failed: {e}")

def get_db():
    global _db_initialized
    if not _db_initialized:
        init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()