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


def _table_exists(conn, table_name: str) -> bool:
    import sqlalchemy
    row = conn.execute(
        sqlalchemy.text("SELECT name FROM sqlite_master WHERE type='table' AND name=:name"),
        {"name": table_name},
    ).fetchone()
    return row is not None


def init_db() -> None:
    """Create all tables and apply incremental migrations."""
    import models  # noqa: F401 — register ORM models with Base.metadata
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    _normalize_existing_profiles()


def _normalize_existing_profiles() -> None:
    """Fix legacy LLM output where skills/strengths were stored as dict objects."""
    from models import CareerProfile
    from services.profile_utils import coerce_string_list

    db = SessionLocal()
    try:
        profile = db.query(CareerProfile).first()
        if not profile:
            return
        profile.set_skills(coerce_string_list(profile.get_skills()))
        profile.set_strengths(coerce_string_list(profile.get_strengths()))
        profile.set_weaknesses(coerce_string_list(profile.get_weaknesses()))
        profile.set_interests(coerce_string_list(profile.get_interests()))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def _add_missing_columns(conn, table_name: str, columns: list[tuple[str, str]]) -> None:
    import sqlalchemy
    if not _table_exists(conn, table_name):
        return
    existing = {row[1] for row in conn.execute(sqlalchemy.text(f"PRAGMA table_info({table_name})"))}
    for col_name, col_def in columns:
        if col_name not in existing:
            conn.execute(sqlalchemy.text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def}"))


def migrate_schema():
    """Add Phase 5/6/7/8 columns and migrate legacy status values."""
    import sqlalchemy
    application_columns = [
        ("score_fit", "FLOAT DEFAULT 0.0"),
        ("score_timing", "FLOAT DEFAULT 0.0"),
        ("score_competition", "FLOAT DEFAULT 0.0"),
        ("score_readiness", "FLOAT DEFAULT 0.0"),
        ("score_overall", "FLOAT DEFAULT 0.0"),
        ("jd_parsed", "TEXT DEFAULT '{}'"),
        ("match_report", "TEXT DEFAULT '{}'"),
        ("recommendations", "TEXT DEFAULT '[]'"),
        ("priority", "VARCHAR(10) DEFAULT 'normal'"),
        ("deadline", "DATETIME"),
        ("applied_at", "DATETIME"),
        ("interview_at", "DATETIME"),
        ("board_order", "INTEGER DEFAULT 0"),
        ("outreach_sequence", "TEXT DEFAULT '{}'"),
    ]
    profile_columns = [
        ("personal_name", "VARCHAR(255) DEFAULT ''"),
        ("personal_email", "VARCHAR(255) DEFAULT ''"),
        ("personal_phone", "VARCHAR(50) DEFAULT ''"),
        ("personal_location", "VARCHAR(255) DEFAULT ''"),
        ("personal_linkedin", "VARCHAR(500) DEFAULT ''"),
        ("personal_github", "VARCHAR(500) DEFAULT ''"),
        ("certifications", "TEXT DEFAULT '[]'"),
        ("languages", "TEXT DEFAULT '[]'"),
        ("ai_summary", "TEXT DEFAULT ''"),
        ("experience_level", "VARCHAR(50) DEFAULT ''"),
        ("tech_stack", "TEXT DEFAULT '[]'"),
        ("interests", "TEXT DEFAULT '[]'"),
        ("strengths", "TEXT DEFAULT '[]'"),
        ("weaknesses", "TEXT DEFAULT '[]'"),
        ("profile_generated_at", "DATETIME"),
    ]
    prep_columns = [
        ("company_intel", "TEXT DEFAULT '{}'"),
        ("prep_notes", "TEXT DEFAULT '{}'"),
        ("ai_suggestions", "TEXT DEFAULT '[]'"),
    ]
    status_migrations = [
        ("saved", "draft"),
        ("screening", "assessment"),
    ]
    with engine.connect() as conn:
        _add_missing_columns(conn, "career_profile", profile_columns)
        _add_missing_columns(conn, "applications", application_columns)
        _add_missing_columns(conn, "interview_prep", prep_columns)
        if _table_exists(conn, "applications"):
            for old_status, new_status in status_migrations:
                conn.execute(
                    sqlalchemy.text("UPDATE applications SET status = :new WHERE status = :old"),
                    {"old": old_status, "new": new_status},
                )
        conn.commit()
