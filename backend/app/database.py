"""
Database engine and session management.

Uses SQLAlchemy with a SQLite backend. `get_db` is a FastAPI dependency
that yields a session per-request and guarantees it is closed afterwards.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# `check_same_thread` is required for SQLite when accessed from multiple
# threads (FastAPI's threadpool for sync endpoints).
connect_args = (
    {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Called once on application startup."""
    # Import models here so they are registered on Base.metadata
    # before create_all is invoked.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
