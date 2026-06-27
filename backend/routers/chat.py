import json
import logging
import re

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from models import Application, ChatMessage
from schemas import ChatMessageResponse
from services.exceptions import LLMProviderError
from services.llm_client import generate_stream, generate
from services.profile_service import get_profile, profile_to_dict
from services.job_analyzer import analyze_job

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


async def _handle_message(websocket: WebSocket, db: Session, user_msg: str):
    user_message = ChatMessage(role="user", content=user_msg)
    db.add(user_message)
    db.commit()

    intent = detect_intent(user_msg)

    if intent == "upload_resume":
        await websocket.send_json({
            "type": "assistant_text",
            "content": "Please upload your resume PDF using the upload button in the sidebar, or drag and drop a PDF file.",
        })
        await websocket.send_json({
            "type": "action",
            "action_type": "show_upload",
            "data": {},
        })

    elif intent == "analyze_job":
        profile = get_profile(db)
        if not profile:
            await websocket.send_json({
                "type": "assistant_text",
                "content": "You need to upload your resume first before I can analyze jobs. Please upload your resume PDF.",
            })
            await websocket.send_json({
                "type": "action",
                "action_type": "show_upload",
                "data": {},
            })
            return

        jd = extract_job_description(user_msg)
        profile_dict = profile_to_dict(profile)

        await websocket.send_json({
            "type": "assistant_text",
            "content": "Analyzing this job against your profile...",
        })

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
        summary = (
            f"Done! I've analyzed the {result.get('company', 'Unknown')} "
            f"{result.get('role', 'role')} position.\n\n"
            f"**Match Score: {score_pct}%**\n\n"
            f"{result.get('match_analysis', '')[:300]}"
        )

        await websocket.send_json({
            "type": "assistant_text",
            "content": summary,
        })
        await websocket.send_json({
            "type": "action",
            "action_type": "application_created",
            "data": {"application_id": app.id},
        })

    elif intent == "show_applications":
        apps = db.query(Application).order_by(Application.created_at.desc()).all()
        if not apps:
            await websocket.send_json({
                "type": "assistant_text",
                "content": "You don't have any applications yet. Paste a job description and I'll analyze it for you!",
            })
        else:
            counts = {}
            for a in apps:
                counts[a.status] = counts.get(a.status, 0) + 1
            summary = f"You have {len(apps)} application(s):\n"
            for status, count in counts.items():
                summary += f"- {status.title()}: {count}\n"
            await websocket.send_json({
                "type": "assistant_text",
                "content": summary,
            })
            await websocket.send_json({
                "type": "action",
                "action_type": "show_applications",
                "data": {},
            })

    elif intent == "show_profile":
        profile = get_profile(db)
        if not profile:
            await websocket.send_json({
                "type": "assistant_text",
                "content": "No career profile found yet. Upload your resume to get started!",
            })
        else:
            skills = profile.get_skills()
            summary = f"Your career profile:\n\n**Summary:** {profile.summary[:200]}\n\n**Skills:** {', '.join(skills[:10])}"
            await websocket.send_json({
                "type": "assistant_text",
                "content": summary,
            })
            await websocket.send_json({
                "type": "action",
                "action_type": "show_profile",
                "data": {},
            })

    else:
        profile = get_profile(db)
        context = ""
        if profile:
            profile_dict = profile_to_dict(profile)
            context = f"\n\nUser profile context: {json.dumps(profile_dict, indent=2)[:1000]}"

        try:
            async for chunk in generate_stream(user_msg + context, system=SYSTEM_PROMPT):
                await websocket.send_json({
                    "type": "assistant_stream",
                    "content": chunk,
                })
            await websocket.send_json({"type": "assistant_stream_end"})
        except LLMProviderError:
            logger.exception("LLM error during streaming chat")
            await websocket.send_json({
                "type": "error",
                "content": "AI service is temporarily unavailable. Please try again.",
            })
            return

    assistant_message = ChatMessage(role="assistant", content="Response sent")
    db.add(assistant_message)
    db.commit()


@router.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()

    try:
        while True:
            data = await websocket.receive_json()
            user_msg = data.get("content", "")

            if not user_msg:
                continue

            try:
                await _handle_message(websocket, db, user_msg)
            except LLMProviderError:
                logger.exception("LLM provider error in chat")
                await websocket.send_json({
                    "type": "error",
                    "content": "AI service error. Please try again.",
                })
            except SQLAlchemyError:
                db.rollback()
                logger.exception("Database error in chat")
                await websocket.send_json({
                    "type": "error",
                    "content": "A database error occurred. Please try again.",
                })
            except Exception:
                logger.exception("Unexpected error in chat")
                await websocket.send_json({
                    "type": "error",
                    "content": "Something went wrong. Please try again.",
                })

            await websocket.send_json({"type": "done"})

    except WebSocketDisconnect:
        logger.info("Chat client disconnected")
    finally:
        db.close()


@router.get("/api/chat/history", response_model=list[ChatMessageResponse])
def chat_history(db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
        .all()
    )
    return list(reversed(messages))
