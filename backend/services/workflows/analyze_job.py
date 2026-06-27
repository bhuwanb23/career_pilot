from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Upload your resume first before I can analyze jobs.")
    return StepResult(success=True, data=profile)


async def prepare_data(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    from routers.chat import extract_job_description
    profile_dict = profile_to_dict(ctx["check_profile"])
    jd = extract_job_description(kw["user_msg"])
    return StepResult(success=True, data={"profile": profile_dict, "jd": jd})


async def llm_analyze(ctx, db, **kw):
    from services.job_analyzer import analyze_job
    data = ctx["prepare_data"]
    result = await analyze_job(data["jd"], data["profile"])
    return StepResult(success=True, data=result)


async def save_application(ctx, db, **kw):
    from models import Application
    result = ctx["llm_analyze"]
    data = ctx["prepare_data"]
    app = Application(
        company=result.get("company", "Unknown"),
        role=result.get("role", "Unknown"),
        job_description=data["jd"],
        status="applied",
        cover_letter=result.get("cover_letter", ""),
        recruiter_msg=result.get("recruiter_msg", ""),
        match_score=result.get("match_score", 0.0),
        match_analysis=result.get("match_analysis", ""),
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return StepResult(success=True, data=app)


async def respond(ctx, db, **kw):
    result = ctx["llm_analyze"]
    app = ctx["save_application"]
    score_pct = int(result.get("match_score", 0) * 100)
    text = (
        f"Done! Analyzed **{result.get('company', 'Unknown')} - {result.get('role', 'role')}**\n\n"
        f"**Match Score: {score_pct}%**\n\n"
        f"{result.get('match_analysis', '')[:300]}"
    )
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "application_created", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="analyze_job", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="prepare_data", step_type="prepare", fn=prepare_data, params={"user_msg": user_msg, "websocket": websocket}),
        StepSpec(name="llm_analyze", step_type="llm_call", fn=llm_analyze),
        StepSpec(name="save_application", step_type="db_write", fn=save_application),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
