from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Please upload your resume first before creating an application.")
    return StepResult(success=True, data=profile)


async def analyze_and_create(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    from services.smart_application import run_smart_application, apply_smart_result_to_application
    from services.application_management import record_activity
    from services.pipeline import advance_pipeline
    from models import Application, PipelineStage
    from routers.chat import extract_job_description

    profile = ctx["check_profile"]
    profile_dict = profile_to_dict(profile)
    jd = extract_job_description(kw["user_msg"])

    if len(jd.strip()) < 20:
        return StepResult(success=False, error="Please provide more details about the job (role, company, requirements).")

    result = await run_smart_application(jd, "", profile_dict)

    app = Application(job_description=jd, url="", status="draft")
    apply_smart_result_to_application(app, result)
    db.add(app)
    db.commit()
    db.refresh(app)

    record_activity(db, app.id, "status_change", "Application created via chat", {"to": "draft"})
    db.commit()
    advance_pipeline(db, app.id, PipelineStage.JD_PARSED)

    return StepResult(success=True, data={"app": app, "result": result})


async def respond(ctx, db, **kw):
    data = ctx["analyze_and_create"]
    app = data["app"]
    result = data["result"]

    score_pct = int(result.get("match_score", 0) * 100)
    company = result.get("company") or "Unknown"
    role = result.get("role") or "Position"

    text = (
        f"Application created for **{company} - {role}**\n\n"
        f"**Match Score: {score_pct}%**\n\n"
        f"{result.get('match_analysis', '')[:300]}\n\n"
        f"Application saved as draft. You can view and manage it in the Applications board."
    )

    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "application_created", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="create_application", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="analyze_and_create", step_type="db_write", fn=analyze_and_create, params={"user_msg": user_msg}),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
