import re
from services.workflow import StepResult, StepSpec, Workflow


def extract_company_from_message(user_msg: str) -> str | None:
    """Extract company name from user message."""
    patterns = [
        r"for\s+(?:the\s+)?([A-Z][a-zA-Z\s]+?)(?:\s+role|\s+position|\s+job|$)",
        r"at\s+([A-Z][a-zA-Z\s]+?)(?:\s+role|\s+position|\s+job|$)",
        r"([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:role|position|job)",
    ]
    for pattern in patterns:
        match = re.search(pattern, user_msg)
        if match:
            company = match.group(1).strip()
            if len(company) > 1 and len(company) < 30:
                return company
    return None


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Upload your resume first so I can write a tailored cover letter.")
    return StepResult(success=True, data=profile)


async def check_app(ctx, db, **kw):
    from routers.chat import _get_latest_app
    user_msg = kw.get("user_msg", "")
    company = extract_company_from_message(user_msg)
    
    if company:
        from models import Application
        app = db.query(Application).filter(
            Application.company.ilike(f"%{company}%")
        ).first()
        if not app:
            app = _get_latest_app(db)
    else:
        app = _get_latest_app(db)
    
    if not app:
        return StepResult(success=False, error="No applications yet. Analyze a job first.")
    return StepResult(success=True, data=app)


async def generate_letter(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    from services.cover_letter import generate_cover_letter
    app = ctx["check_app"]
    profile_dict = profile_to_dict(ctx["check_profile"])
    letter = await generate_cover_letter(
        profile_dict, app.company, app.role, app.job_description or ""
    )
    return StepResult(success=True, data={"cover_letter": letter})


async def save(ctx, db, **kw):
    app = ctx["check_app"]
    letter = ctx["letter"]
    if isinstance(letter, dict):
        letter = letter.get("cover_letter", str(letter))
    app.cover_letter = letter
    db.commit()
    from services.pipeline import advance_pipeline
    from models import PipelineStage
    advance_pipeline(db, app.id, PipelineStage.COVER_LETTER_READY)
    return StepResult(success=True)


async def respond(ctx, db, **kw):
    app = ctx["check_app"]
    letter = ctx["letter"]
    if isinstance(letter, dict):
        letter = letter.get("cover_letter", str(letter))
    text = f"Cover letter for **{app.company} - {app.role}**:\n\n{letter}"
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "cover_letter_generated", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_cover_letter", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="check_app", step_type="check", fn=check_app, params={"user_msg": user_msg}),
        StepSpec(name="letter", step_type="generate", fn=generate_letter),
        StepSpec(name="save", step_type="db_write", fn=save),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])