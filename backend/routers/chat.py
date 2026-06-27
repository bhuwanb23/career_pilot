import json
import logging
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Application, ChatMessage
from schemas import ChatMessageResponse
from services.exceptions import LLMProviderError
from services.llm_client import generate_stream, generate
from services.profile_service import get_profile, profile_to_dict
from services.workflow import WorkflowExecutor
from services.workflows import get_workflow

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

SYSTEM_PROMPT = """You are CareerPilot, a helpful AI career assistant.
You help users with resume analysis, job applications, and interview prep.
Be concise, professional, and actionable.
When the user asks you to do something, acknowledge and do it.
Keep responses under 200 words unless they ask for detail."""

INTENT_KEYWORDS = [
    ("upload_resume", {"upload", "parse", "resume", "pdf"}, {"upload", "parse"}),
    ("generate_cover_letter", {"cover", "letter"}, {"cover"}),
    ("generate_recruiter_msg", {"recruiter", "linkedin", "outreach", "cold", "email", "dm"}, {"recruiter", "linkedin", "outreach", "cold", "dm"}),
    ("generate_resume", {"generate", "write", "create", "build", "make", "resume"}, {"generate", "write", "create", "build", "make"}, {"resume"}),
    ("placement_analytics", {"analytics", "stats", "progress", "report", "doing"}, {"analytics", "stats", "progress", "report", "doing"}),
    ("prepare_interview", {"interview", "prepare", "prep", "practice", "mock"}, {"prepare", "prep", "practice", "mock"}),
    ("analyze_job", {"analyze", "job", "description", "role", "position"}, {"analyze"}),
    ("show_applications", {"show", "list", "applications", "tracker", "kanban"}, {"list", "tracker", "kanban", "applications"}),
    ("show_profile", {"profile", "skills", "experience"}, {"profile", "skills", "experience"}),
]

LLM_CLASSIFY_PROMPT = """Classify this user message into exactly ONE intent.
Intents:
- upload_resume: User wants to upload/parse a resume PDF
- generate_resume: User wants to generate/create/write a new resume
- generate_cover_letter: User wants a cover letter for a job
- generate_recruiter_msg: User wants a LinkedIn/email message for outreach
- analyze_job: User wants to analyze a job description
- prepare_interview: User wants interview preparation
- show_applications: User wants to see their applications
- show_profile: User wants to see their career profile
- placement_analytics: User wants to see job search stats/progress
- general_chat: General conversation or question

Return ONLY valid JSON: {"intent": "<intent_name>", "confidence": 0.0-1.0}
No markdown fences, no extra text."""


def detect_intent(message: str) -> str:
    msg = set(message.lower().split())

    for entry in INTENT_KEYWORDS:
        intent, all_words, trigger_words = entry[0], entry[1], entry[2]
        context_words = entry[3] if len(entry) > 3 else None

        if context_words:
            if msg & trigger_words and msg & context_words:
                return intent
        else:
            if msg & trigger_words:
                return intent

    return "general_chat"


async def classify_intent_with_llm(message: str) -> str:
    try:
        response = await generate(message, system=LLM_CLASSIFY_PROMPT)
        response = response.strip()
        if response.startswith("```"):
            response = response.split("\n", 1)[1]
        if response.endswith("```"):
            response = response.rsplit("```", 1)[0]
        result = json.loads(response.strip())
        intent = result.get("intent", "general_chat")
        confidence = result.get("confidence", 0.0)
        if confidence >= 0.6 and intent in [
            "upload_resume", "generate_resume", "generate_cover_letter",
            "generate_recruiter_msg", "analyze_job", "prepare_interview",
            "show_applications", "show_profile", "placement_analytics",
            "general_chat",
        ]:
            return intent
    except Exception:
        logger.debug("LLM intent classification failed, falling back to general_chat")
    return "general_chat"


def extract_job_description(message: str) -> str:
    patterns = [
        r"(?:analyze|apply|job description)[:\s]+(.+)",
        r"(?:paste|here's|here is)(?:\s+the)?(?:\s+job(?:\s+description)?)?[:\s]+(.+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, message, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return message


def get_conversation_history(db: Session, session_id: str, limit: int = 20) -> list[dict]:
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
        .all()
    )
    messages.reverse()
    return [{"role": m.role, "content": m.content} for m in messages if m.content and m.content != "Response sent"]


def build_chat_prompt(user_msg: str, history: list[dict], profile_context: str) -> str:
    if not history:
        prompt = user_msg
    else:
        turns = []
        for msg in history:
            label = "User" if msg["role"] == "user" else "Assistant"
            turns.append(f"{label}: {msg['content']}")
        turns.append(f"User: {user_msg}")
        prompt = "[Conversation History]\n" + "\n".join(turns)

    if profile_context:
        prompt += f"\n\n[User Profile]\n{profile_context}"

    return prompt


def _get_latest_app(db: Session) -> Application | None:
    return db.query(Application).order_by(Application.created_at.desc()).first()


async def _handle_general_chat(websocket: WebSocket, db: Session, session_id: str, user_msg: str) -> str | None:
    profile = get_profile(db)
    profile_context = ""
    if profile:
        profile_dict = profile_to_dict(profile)
        profile_context = json.dumps(profile_dict, indent=2)[:1000]

    history = get_conversation_history(db, session_id)
    prompt = build_chat_prompt(user_msg, history, profile_context)

    response_text = ""
    try:
        async for chunk in generate_stream(prompt, system=SYSTEM_PROMPT):
            response_text += chunk
            await websocket.send_json({"type": "assistant_stream", "content": chunk})
        await websocket.send_json({"type": "assistant_stream_end"})
    except LLMProviderError:
        logger.exception("LLM error during streaming chat")
        await websocket.send_json({"type": "error", "content": "AI service is temporarily unavailable. Please try again."})
        return None

    return response_text


async def _handle_message(websocket: WebSocket, db: Session, session_id: str, user_msg: str) -> str | None:
    user_message = ChatMessage(session_id=session_id, role="user", content=user_msg)
    db.add(user_message)
    db.commit()

    intent = detect_intent(user_msg)

    if intent == "general_chat":
        classified = await classify_intent_with_llm(user_msg)
        if classified != "general_chat":
            intent = classified

    workflow = get_workflow(intent, user_msg, websocket)
    if workflow:
        executor = WorkflowExecutor(websocket, db, session_id)
        response_text = await executor.execute(workflow)
    else:
        response_text = await _handle_general_chat(websocket, db, session_id, user_msg)

    assistant_message = ChatMessage(session_id=session_id, role="assistant", content=response_text or "")
    db.add(assistant_message)
    db.commit()

    return response_text


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid4())
    db = SessionLocal()

    try:
        await websocket.send_json({"type": "session", "session_id": session_id})

        while True:
            data = await websocket.receive_json()
            user_msg = data.get("content", "")

            if not user_msg:
                continue

            try:
                await _handle_message(websocket, db, session_id, user_msg)
            except LLMProviderError:
                logger.exception("LLM provider error in chat")
                await websocket.send_json({"type": "error", "content": "AI service error. Please try again."})
            except SQLAlchemyError:
                db.rollback()
                logger.exception("Database error in chat")
                await websocket.send_json({"type": "error", "content": "A database error occurred. Please try again."})
            except Exception:
                logger.exception("Unexpected error in chat")
                await websocket.send_json({"type": "error", "content": "Something went wrong. Please try again."})

            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        logger.info("Chat client disconnected (session=%s)", session_id)
    finally:
        db.close()


@router.get("/api/chat/history", response_model=list[ChatMessageResponse])
def chat_history(session_id: str | None = Query(None), db: Session = Depends(get_db)):
    query = db.query(ChatMessage)
    if session_id:
        query = query.filter(ChatMessage.session_id == session_id)
    messages = query.order_by(ChatMessage.created_at.desc()).limit(50).all()
    return list(reversed(messages))


@router.get("/api/chat/sessions")
def chat_sessions(db: Session = Depends(get_db)):
    from sqlalchemy import func

    sessions = (
        db.query(
            ChatMessage.session_id,
            func.min(ChatMessage.created_at).label("created_at"),
            func.max(ChatMessage.id).label("last_msg_id"),
        )
        .group_by(ChatMessage.session_id)
        .order_by(func.max(ChatMessage.id).desc())
        .all()
    )

    result = []
    for s in sessions:
        last_msg = db.query(ChatMessage).filter(ChatMessage.id == s.last_msg_id).first()
        result.append({
            "session_id": s.session_id,
            "created_at": s.created_at,
            "message_count": db.query(ChatMessage).filter(ChatMessage.session_id == s.session_id).count(),
            "last_message": last_msg.content[:100] if last_msg else "",
        })
    return result


@router.post("/api/resume/generate")
async def generate_resume_endpoint(job_description: str = "", db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        return Response(content="No career profile found. Upload a resume first.", status_code=400)

    from services.resume_generator import generate_resume, resume_to_pdf
    profile_dict = profile_to_dict(profile)
    resume_data = await generate_resume(profile_dict, job_description)
    pdf_bytes = resume_to_pdf(resume_data)

    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"},
    )
