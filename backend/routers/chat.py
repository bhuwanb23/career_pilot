import json
import logging
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
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
from services.resume_generator import generate_resume, resume_to_pdf
from services.cover_letter import generate_cover_letter
from services.recruiter_msg import generate_recruiter_msg
from services.analytics import get_raw_analytics, get_analytics_summary

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


async def _handle_message(websocket: WebSocket, db: Session, session_id: str, user_msg: str) -> str | None:
    user_message = ChatMessage(session_id=session_id, role="user", content=user_msg)
    db.add(user_message)
    db.commit()

    intent = detect_intent(user_msg)

    if intent == "general_chat":
        classified = await classify_intent_with_llm(user_msg)
        if classified != "general_chat":
            intent = classified

    if intent == "upload_resume":
        response_text = "Please upload your resume PDF using the upload button in the sidebar, or drag and drop a PDF file."
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})

    elif intent == "generate_resume":
        profile = get_profile(db)
        if not profile:
            response_text = "You need to upload your resume first so I have your career data to work with."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})
            return response_text

        await websocket.send_json({"type": "assistant_text", "content": "Generating your resume..."})

        profile_dict = profile_to_dict(profile)
        jd = extract_job_description(user_msg)
        resume_data = await generate_resume(profile_dict, jd)
        pdf_bytes = resume_to_pdf(resume_data)

        import base64
        pdf_b64 = base64.b64encode(pdf_bytes).decode()
        response_text = f"Your resume has been generated! ({len(pdf_bytes)} bytes)\n\n**Sections:** {', '.join(k for k in ['summary', 'experience', 'education', 'skills', 'projects'] if resume_data.get(k))}"
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "resume_generated", "data": {"pdf_base64": pdf_b64, "resume_data": resume_data}})

    elif intent == "generate_cover_letter":
        profile = get_profile(db)
        if not profile:
            response_text = "You need to upload your resume first so I can write a tailored cover letter."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})
            return response_text

        app = _get_latest_app(db)
        if not app:
            response_text = "You don't have any applications yet. Analyze a job first, then I can write a cover letter for it."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            return response_text

        await websocket.send_json({"type": "assistant_text", "content": f"Writing a cover letter for **{app.company} - {app.role}**..."})

        profile_dict = profile_to_dict(profile)
        letter = await generate_cover_letter(profile_dict, app.company, app.role, app.job_description)
        app.cover_letter = letter
        db.commit()

        response_text = f"Cover letter for **{app.company} - {app.role}**:\n\n{letter}"
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "cover_letter_generated", "data": {"application_id": app.id}})

    elif intent == "generate_recruiter_msg":
        profile = get_profile(db)
        if not profile:
            response_text = "You need to upload your resume first so I can craft a personalized outreach message."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            await websocket.send_json({"type": "action", "action_type": "show_upload", "data": {}})
            return response_text

        app = _get_latest_app(db)
        if not app:
            response_text = "You don't have any applications yet. Analyze a job first, then I can write an outreach message."
            await websocket.send_json({"type": "assistant_text", "content": response_text})
            return response_text

        channel = "linkedin"
        msg_lower = user_msg.lower()
        if "email" in msg_lower:
            channel = "email"
        elif "cold" in msg_lower:
            channel = "cold outreach"

        await websocket.send_json({"type": "assistant_text", "content": f"Drafting a {channel} message for **{app.company} - {app.role}**..."})

        profile_dict = profile_to_dict(profile)
        message_text = await generate_recruiter_msg(profile_dict, app.company, app.role, channel)
        app.recruiter_msg = message_text
        db.commit()

        response_text = f"Recruiter message for **{app.company}** ({channel}):\n\n{message_text}"
        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "recruiter_msg_generated", "data": {"application_id": app.id}})

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

    elif intent == "placement_analytics":
        await websocket.send_json({"type": "assistant_text", "content": "Crunching your numbers..."})
        analytics = await get_analytics_summary(db)
        total = analytics["total_applications"]
        avg = analytics["avg_match_score"]
        narrative = analytics.get("narrative", "")

        response_text = f"**Your Job Search Dashboard**\n\n"
        response_text += f"Total Applications: **{total}**\n"
        response_text += f"Average Match Score: **{int(avg * 100)}%**\n\n"

        breakdown = analytics.get("status_breakdown", {})
        if breakdown:
            response_text += "**Status Breakdown:**\n"
            for status, count in breakdown.items():
                response_text += f"- {status.title()}: {count}\n"

        top_cos = analytics.get("top_companies", [])
        if top_cos:
            response_text += f"\n**Top Companies:** {', '.join(c['company'] for c in top_cos[:3])}\n"

        if narrative:
            response_text += f"\n{narrative}"

        await websocket.send_json({"type": "assistant_text", "content": response_text})
        await websocket.send_json({"type": "action", "action_type": "show_analytics", "data": analytics})

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


@router.post("/api/resume/generate")
async def generate_resume_pdf(job_description: str = "", db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        return Response(content="No career profile found. Upload a resume first.", status_code=400)

    profile_dict = profile_to_dict(profile)
    resume_data = await generate_resume(profile_dict, job_description)
    pdf_bytes = resume_to_pdf(resume_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=resume.pdf"},
    )
