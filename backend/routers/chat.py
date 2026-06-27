import json
import logging
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Application, ChatMessage, InterviewPrep
from schemas import ChatMessageResponse
from services.exceptions import LLMProviderError
from services.llm_client import generate_stream, generate
from services.profile_service import get_profile, profile_to_dict
from services.job_analyzer import analyze_job
from services.interview_prep import generate_prep

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

SYSTEM_PROMPT = """You are CareerPilot, a helpful AI career assistant.
You help users with resume analysis, job applications, and interview prep.
Be concise, professional, and actionable.
When the user asks you to do something, acknowledge and do it.
Keep responses under 200 words unless they ask for detail."""


def detect_intent(message: str) -> str:
    msg = message.lower()
    if any(w in msg for w in ["upload", "resume", "parse resume"]):
        return "upload_resume"
    if any(w in msg for w in ["analyze", "job", "apply", "job description"]):
        return "analyze_job"
    if any(w in msg for w in ["interview", "prepare", "prep"]):
        return "prepare_interview"
    if any(w in msg for w in ["show", "list", "applications", "tracker", "kanban"]):
        return "show_applications"
    if any(w in msg for w in ["profile", "my skills", "my experience"]):
        return "show_profile"
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
    return [{"role": m.role, "content": m.content} for m in messages if m.content != "Response sent"]


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


async def _handle_message(websocket: WebSocket, db: Session, session_id: str, user_msg: str) -> str | None:
    user_message = ChatMessage(session_id=session_id, role="user", content=user_msg)
    db.add(user_message)
    db.commit()

    intent = detect_intent(user_msg)

    if intent == "upload_resume":
        response_text = "Please upload your resume PDF using the upload button in the sidebar, or drag and drop a PDF file."
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})

    elif intent == "analyze_job":
        profile = get_profile(db)
        if not profile:
            response_text = "You need to upload your resume first before I can analyze jobs. Please upload your resume PDF."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})
            return response_text

        jd = extract_job_description(user_msg)
        profile_dict = profile_to_dict(profile)

        await websocket.send_json({"type": "assistant_text", "content": "Analyzing this job against your profile..."})

        result = await analyze_job(jd, profile_dict)

        app = Application(
            company=result.get("company", "Unknown"),
            role=result.get("role", "Unknown"),
            job_description=jd,
            status="applied",
            cover_letter=result.get("cover_letter", ""),
            recruiter_msg=result.get("recruiter_msg", ""),
            match_score=result.get("match_score", 0.0),
            match_analysis=result.get("match_analysis", ""),
        )
        db.add(app)
        db.commit()
        db.refresh(app)

        score_pct = int(result.get("match_score", 0) * 100)
        response_text = (
            f"Done! I've analyzed the {result.get('company', 'Unknown')} "
            f"{result.get('role', 'role')} position.\n\n"
            f"**Match Score: {score_pct}%**\n\n"
            f"{result.get('match_analysis', '')[:300]}"
        )

        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "application_created", "data": {"application_id": app.id}})

    elif intent == "prepare_interview":
        apps = db.query(Application).order_by(Application.created_at.desc()).all()
        if not apps:
            response_text = "You don't have any applications yet. Analyze a job first, then I can help you prepare for the interview."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            return response_text

        latest_app = apps[0]
        existing = db.query(InterviewPrep).filter(InterviewPrep.application_id == latest_app.id).first()
        if existing:
            response_text = (
                f"Interview prep for **{latest_app.company} - {latest_app.role}** is already ready!\n\n"
                f"{existing.company_summary[:200]}\n\n"
                f"Check the interview prep tab for detailed questions and STAR answers."
            )
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            await websocket.send_json({"type": "action", "action_type": "show_interview_prep", "data": {"application_id": latest_app.id}})
            return response_text

        profile = get_profile(db)
        if not profile:
            response_text = "You need to upload your resume first so I can tailor interview prep to your experience."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})
            return response_text

        await websocket.send_json({"type": "assistant_text", "content": f"Preparing interview material for **{latest_app.company} - {latest_app.role}**..."})

        profile_dict = profile_to_dict(profile)
        result = await generate_prep(
            company=latest_app.company,
            role=latest_app.role,
            job_description=latest_app.job_description,
            profile_data=profile_dict,
        )

        prep = InterviewPrep(
            application_id=latest_app.id,
            company_summary=result.get("company_summary", ""),
        )
        prep.set_questions(result.get("questions", []))
        prep.set_star_answers(result.get("star_answers", []))
        db.add(prep)
        db.commit()

        response_text = (
            f"Interview prep for **{latest_app.company} - {latest_app.role}** is ready!\n\n"
            f"{result.get('company_summary', '')[:200]}\n\n"
            f"I've generated {len(result.get('questions', []))} practice questions and "
            f"{len(result.get('star_answers', []))} STAR answers. Check the interview prep tab for details."
        )
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "show_interview_prep", "data": {"application_id": latest_app.id}})

    elif intent == "show_applications":
        apps = db.query(Application).order_by(Application.created_at.desc()).all()
        if not apps:
            response_text = "You don't have any applications yet. Paste a job description and I'll analyze it for you!"
        else:
            counts = {}
            for a in apps:
                counts[a.status] = counts.get(a.status, 0) + 1
            response_text = f"You have {len(apps)} application(s):\n"
            for status, count in counts.items():
                response_text += f"- {status.title()}: {count}\n"
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "show_applications", "data": {}})

    elif intent == "show_profile":
        profile = get_profile(db)
        if not profile:
            response_text = "No career profile found yet. Upload your resume to get started!"
        else:
            skills = profile.get_skills()
            response_text = f"Your career profile:\n\n**Summary:** {profile.summary[:200]}\n\n**Skills:** {', '.join(skills[:10])}"
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "show_profile", "data": {}})

    else:
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
