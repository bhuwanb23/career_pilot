import json
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import CareerMemory

logger = logging.getLogger(__name__)


def store_memory(db: Session, category: str, key: str, value: str,
                 metadata: dict = None, source: str = "system", confidence: float = 1.0):
    existing = db.query(CareerMemory).filter_by(category=category, key=key).first()
    if existing:
        existing.value = value
        if metadata:
            existing.set_metadata(metadata)
        existing.source = source
        existing.confidence = confidence
    else:
        mem = CareerMemory(
            category=category, key=key, value=value,
            source=source, confidence=confidence,
        )
        if metadata:
            mem.set_metadata(metadata)
        db.add(mem)
    db.commit()


def get_memory_value(db: Session, category: str, key: str) -> str | None:
    mem = db.query(CareerMemory).filter_by(category=category, key=key).first()
    return mem.value if mem else None


def get_memory_by_category(db: Session, category: str) -> list[dict]:
    mems = db.query(CareerMemory).filter_by(category=category).order_by(CareerMemory.created_at.desc()).all()
    return [
        {"id": m.id, "key": m.key, "value": m.value, "metadata": m.get_metadata(),
         "confidence": m.confidence, "source": m.source, "created_at": m.created_at}
        for m in mems
    ]


def get_all_career_memory(db: Session) -> dict:
    categories = db.query(CareerMemory.category).distinct().all()
    result = {}
    for (cat,) in categories:
        result[cat] = get_memory_by_category(db, cat)
    return result


def delete_memory(db: Session, memory_id: int) -> bool:
    mem = db.query(CareerMemory).filter(CareerMemory.id == memory_id).first()
    if not mem:
        return False
    db.delete(mem)
    db.commit()
    return True


def store_resume_version(db: Session, profile_data: dict, version_num: int):
    store_memory(db, "version", f"resume_v{version_num}",
                 json.dumps({"version": version_num, "skills": profile_data.get("skills", []),
                             "summary": profile_data.get("summary", "")[:200]}),
                 metadata={"version": version_num}, source="system")


def store_skill_snapshot(db: Session, skills: list[str]):
    store_memory(db, "skill", "current_skills",
                 json.dumps(skills), metadata={"count": len(skills)}, source="system")


def store_preference(db: Session, pref_type: str, value: str):
    store_memory(db, "preference", pref_type, value, source="user")


def store_goal(db: Session, goal_text: str, status: str = "active"):
    store_memory(db, "goal", f"goal_{datetime.now(timezone.utc).strftime('%Y%m%d')}",
                 goal_text, metadata={"status": status}, source="user")


def store_persona_selection(db: Session, persona_id: int, persona_name: str):
    store_memory(db, "persona", "active_persona", persona_name,
                 metadata={"persona_id": persona_id}, source="user")


def get_memory_for_prompt(db: Session) -> str:
    sections = []

    skills = get_memory_by_category(db, "skill")
    if skills:
        latest = skills[0]
        try:
            skill_list = json.loads(latest["value"])
            sections.append(f"[Skills History] Current skills: {', '.join(skill_list[:15])}")
        except (json.JSONDecodeError, TypeError):
            pass

    prefs = get_memory_by_category(db, "preference")
    if prefs:
        lines = [f"- {p['key']}: {p['value']}" for p in prefs[:5]]
        sections.append("[User Preferences]\n" + "\n".join(lines))

    goals = get_memory_by_category(db, "goal")
    if goals:
        lines = []
        for g in goals[:3]:
            status = g.get("metadata", {}).get("status", "active")
            lines.append(f"- [{status}] {g['value']}")
        sections.append("[Career Goals]\n" + "\n".join(lines))

    versions = get_memory_by_category(db, "version")
    if versions:
        sections.append(f"[Resume Versions] {len(versions)} version(s) stored. Latest: {versions[0]['key']}")

    persona = get_memory_value(db, "persona", "active_persona")
    if persona:
        sections.append(f"[Active Persona] {persona}")

    return "\n\n".join(sections) if sections else ""
