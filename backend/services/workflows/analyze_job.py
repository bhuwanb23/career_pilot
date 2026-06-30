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
    return StepResult(success=True, data={"profile_data": profile_dict, "job_description": jd})


async def run_analysis(ctx, db, **kw):
    data = ctx["prepare_data"]
    from services.smart_application import run_smart_application
    result = await run_smart_application(data["job_description"], "", data["profile_data"])
    return StepResult(success=True, data=result)


async def save_application(ctx, db, **kw):
    from models import Application
    from services.smart_application import apply_smart_result_to_application
    from services.application_management import record_activity
    from services.pipeline import advance_pipeline
    from models import PipelineStage

    result = ctx["analysis"]
    data = ctx["prepare_data"]
    app = Application(
        job_description=data["job_description"],
        url="",
        status="draft",
    )
    apply_smart_result_to_application(app, result)
    db.add(app)
    db.commit()
    db.refresh(app)
    record_activity(db, app.id, "status_change", "Application created via chat", {"to": "draft"})
    db.commit()
    advance_pipeline(db, app.id, PipelineStage.JD_PARSED)
    return StepResult(success=True, data=app)


async def respond(ctx, db, **kw):
    result = ctx["analysis"]
    app = ctx["save_application"]
    score_pct = int(result.get("match_score", 0) * 100)
    text = (
        f"Done! Analyzed **{result.get('company', 'Unknown')} - {result.get('role', 'role')}**\n\n"
        f"**Match Score: {score_pct}%**\n\n"
        f"{result.get('match_analysis', '')[:300]}"
    )
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "application_created", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="analyze_job", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="prepare_data", step_type="prepare", fn=prepare_data, params={"user_msg": user_msg}),
        StepSpec(name="analysis", step_type="analyze", fn=run_analysis),
        StepSpec(name="save_application", step_type="db_write", fn=save_application),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
