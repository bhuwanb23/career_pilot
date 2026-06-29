import sqlalchemy

from database import _add_missing_columns, engine, migrate_schema


def test_migrate_schema_adds_career_profile_columns():
    with engine.connect() as conn:
        conn.execute(sqlalchemy.text(
            "CREATE TABLE IF NOT EXISTS _test_legacy_profile (id INTEGER PRIMARY KEY, raw_resume TEXT DEFAULT '', summary TEXT DEFAULT '')"
        ))
        _add_missing_columns(conn, "_test_legacy_profile", [
            ("personal_name", "VARCHAR(255) DEFAULT ''"),
            ("skills", "TEXT DEFAULT '[]'"),
        ])
        cols = {row[1] for row in conn.execute(sqlalchemy.text("PRAGMA table_info(_test_legacy_profile)"))}
        conn.execute(sqlalchemy.text("DROP TABLE _test_legacy_profile"))
        conn.commit()
    assert "personal_name" in cols
    assert "skills" in cols


def test_migrate_schema_idempotent():
    migrate_schema()
    migrate_schema()
