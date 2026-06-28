import logging

from sqlalchemy.orm import Session

from models import ConversationMemory

logger = logging.getLogger(__name__)


def set_memory(db: Session, key: str, value: str, category: str = "general"):
    mem = db.query(ConversationMemory).filter_by(key=key).first()
    if mem:
        mem.value = value
        mem.category = category
    else:
        mem = ConversationMemory(key=key, value=value, category=category)
        db.add(mem)
    db.commit()


def get_memory(db: Session, key: str) -> str | None:
    mem = db.query(ConversationMemory).filter_by(key=key).first()
    return mem.value if mem else None


def get_all_memory(db: Session) -> dict[str, str]:
    mems = db.query(ConversationMemory).all()
    return {m.key: m.value for m in mems}


def get_memory_by_category(db: Session, category: str) -> dict[str, str]:
    mems = db.query(ConversationMemory).filter_by(category=category).all()
    return {m.key: m.value for m in mems}


def get_memory_context(db: Session) -> str:
    facts = get_all_memory(db)
    if not facts:
        return ""
    lines = ["[User Context from Previous Conversations]"]
    for k, v in facts.items():
        lines.append(f"- {k}: {v}")
    return "\n".join(lines)


def extract_and_store_facts(db: Session, user_msg: str, intent: str):
    msg_lower = user_msg.lower()

    if intent == "analyze_job":
        from models import Application
        app = db.query(Application).order_by(Application.created_at.desc()).first()
        if app:
            set_memory(db, "last_company", app.company, "context")
            set_memory(db, "last_role", app.role, "context")
            set_memory(db, "last_application_id", str(app.id), "context")
            logger.debug("Stored memory: last_company=%s, last_role=%s", app.company, app.role)

    elif intent == "generate_resume":
        set_memory(db, "has_generated_resume", "true", "fact")

    elif intent == "generate_cover_letter":
        set_memory(db, "has_cover_letter", "true", "fact")

    elif intent == "generate_recruiter_msg":
        set_memory(db, "has_recruiter_msg", "true", "fact")

    elif intent == "prepare_interview":
        set_memory(db, "has_interview_prep", "true", "fact")

    if any(w in msg_lower for w in ["i want to", "my goal", "i'm trying to", "i need to", "i hope to"]):
        set_memory(db, "user_goal", user_msg[:200], "goal")

    if any(w in msg_lower for w in ["i prefer", "i like", "i don't like", "i hate", "i love"]):
        set_memory(db, "user_preference", user_msg[:200], "preference")
