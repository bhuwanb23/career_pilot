from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Upload your resume first.")
    return StepResult(success=True, data=profile)


async def check_app(ctx, db, **kw):
    from routers.chat import _get_latest_app
    app = _get_latest_app(db)
    if not app:
        return StepResult(success=False, error="No applications yet. Analyze a job first.")
    return StepResult(success=True, data=app)


async def generate_followup(ctx, db, **kw):
    from services.outreach import generate_step
    app = ctx["check_app"]
    try:
        result = await generate_step(db, app, step_type="follow_up", channel="linkedin")
        return StepResult(success=True, data=result)
    except Exception as e:
        return StepResult(success=False, error=str(e))


async def respond(ctx, db, **kw):
    app = ctx["check_app"]
    result = ctx["generate_followup"]
    steps = result.get("steps") or []
    follow_up = next((s for s in steps if s.get("type") == "follow_up" and s.get("message")), None)
    msg = follow_up.get("message", "") if follow_up else "Follow-up generated."
    text = f"Follow-up message for **{app.company}**:\n\n{msg}"
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "follow_up_generated", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_followup", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="check_app", step_type="check", fn=check_app),
        StepSpec(name="generate_followup", step_type="prepare", fn=generate_followup),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
