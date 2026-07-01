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


async def check_apps(ctx, db, **kw):
    from models import Application
    user_msg = kw.get("user_msg", "")
    company = extract_company_from_message(user_msg)
    
    if company:
        apps = db.query(Application).filter(
            Application.company.ilike(f"%{company}%")
        ).order_by(Application.created_at.desc()).all()
        if not apps:
            apps = db.query(Application).order_by(Application.created_at.desc()).all()
    else:
        apps = db.query(Application).order_by(Application.created_at.desc()).all()
    
    if not apps:
        return StepResult(success=False, error="No applications yet. Analyze a job first.")
    return StepResult(success=True, data=apps)


async def check_existing(ctx, db, **kw):
    from models import InterviewPrep
    app = ctx["check_apps"][0]
    existing = db.query(InterviewPrep).filter(InterviewPrep.application_id == app.id).first()
    if existing:
        return StepResult(success=True, data={"cached": True, "prep": existing, "app": app})
    return StepResult(success=True, data={"cached": False, "app": app})


async def check_profile(ctx, db, **kw):
    if ctx["check_existing"].get("cached"):
        return StepResult(success=True, data=None)
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Upload your resume first so I can tailor interview prep.")
    return StepResult(success=True, data=profile)


async def llm_prep(ctx, db, **kw):
    if ctx["check_existing"].get("cached"):
        return StepResult(success=True, data=None)
    from services.profile_service import profile_to_dict
    from services.interview_prep import generate_prep
    data = ctx["check_existing"]
    profile_dict = profile_to_dict(ctx["check_profile"])
    result = await generate_prep(
        company=data["app"].company,
        role=data["app"].role,
        job_description=data["app"].job_description,
        profile_data=profile_dict,
    )
    return StepResult(success=True, data=result)


async def save_prep(ctx, db, **kw):
    if ctx["check_existing"].get("cached"):
        return StepResult(success=True)
    from services.interview_kit import apply_prep_to_model
    from services.interview_prep import prep_to_model_fields
    from models import InterviewPrep
    data = ctx["check_existing"]
    result = ctx["llm_prep"]
    fields = prep_to_model_fields(result)
    prep = InterviewPrep(application_id=data["app"].id)
    apply_prep_to_model(prep, fields)
    db.add(prep)
    db.commit()
    from services.pipeline import advance_pipeline
    from models import PipelineStage
    advance_pipeline(db, data["app"].id, PipelineStage.INTERVIEW_READY)
    return StepResult(success=True)


async def respond(ctx, db, **kw):
    cached = ctx["check_existing"]
    app = cached["app"]
    if cached.get("cached"):
        prep = cached["prep"]
        text = f"Interview prep for **{app.company} - {app.role}** is already ready!\n\n{prep.company_summary[:200]}\n\nCheck the interview prep tab for details."
    else:
        result = ctx["llm_prep"]
        text = (
            f"Interview prep for **{app.company} - {app.role}** is ready!\n\n"
            f"{result.get('company_summary', '')[:200]}\n\n"
            f"I've generated {len(result.get('questions', []))} questions and "
            f"{len(result.get('star_answers', []))} STAR answers."
        )
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "show_interview_prep", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="prepare_interview", steps=[
        StepSpec(name="check_apps", step_type="check", fn=check_apps, params={"user_msg": user_msg}),
        StepSpec(name="check_existing", step_type="check", fn=check_existing),
        StepSpec(name="check_profile", step_type="check", fn=check_profile, optional=True),
        StepSpec(name="llm_prep", step_type="llm_call", fn=llm_prep, optional=True),
        StepSpec(name="save_prep", step_type="db_write", fn=save_prep, optional=True),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])