from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import settings

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
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


def migrate_schema():
    """Add Phase 5 columns to existing SQLite databases."""
    import sqlalchemy
    new_columns = [
        ("score_fit", "FLOAT DEFAULT 0.0"),
        ("score_timing", "FLOAT DEFAULT 0.0"),
        ("score_competition", "FLOAT DEFAULT 0.0"),
        ("score_readiness", "FLOAT DEFAULT 0.0"),
        ("score_overall", "FLOAT DEFAULT 0.0"),
        ("jd_parsed", "TEXT DEFAULT '{}'"),
        ("match_report", "TEXT DEFAULT '{}'"),
        ("recommendations", "TEXT DEFAULT '[]'"),
    ]
    with engine.connect() as conn:
        existing = {row[1] for row in conn.execute(sqlalchemy.text("PRAGMA table_info(applications)"))}
        for col_name, col_def in new_columns:
            if col_name not in existing:
                conn.execute(sqlalchemy.text(f"ALTER TABLE applications ADD COLUMN {col_name} {col_def}"))
        conn.commit()

