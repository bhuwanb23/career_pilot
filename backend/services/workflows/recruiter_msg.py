from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="Upload your resume first so I can craft a personalized outreach message.")
    return StepResult(success=True, data=profile)


async def check_app(ctx, db, **kw):
    from routers.chat import _get_latest_app
    app = _get_latest_app(db)
    if not app:
        return StepResult(success=False, error="No applications yet. Analyze a job first.")
    return StepResult(success=True, data=app)


async def parse_channel(ctx, db, **kw):
    msg = kw["user_msg"].lower()
    channel = "linkedin"
    if "email" in msg:
        channel = "email"
    elif "cold" in msg:
        channel = "cold"
    return StepResult(success=True, data=channel)


async def save(ctx, db, **kw):
    app = ctx["check_app"]
    msg = ctx["message"]
    if isinstance(msg, dict):
        msg = msg.get("message", str(msg))
    app.recruiter_msg = msg
    db.commit()
    from services.pipeline import advance_pipeline
    from models import PipelineStage
    advance_pipeline(db, app.id, PipelineStage.RECRUITER_MSG_READY)
    return StepResult(success=True)


async def respond(ctx, db, **kw):
    app = ctx["check_app"]
    channel = ctx["parse_channel"]
    msg = ctx["message"]
    if isinstance(msg, dict):
        msg = msg.get("message", str(msg))
    text = f"Recruiter message for **{app.company}** ({channel}):\n\n{msg}"
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "recruiter_msg_generated", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_recruiter_msg", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="check_app", step_type="check", fn=check_app),
        StepSpec(name="parse_channel", step_type="prepare", fn=parse_channel, params={"user_msg": user_msg}),
        StepSpec(name="message", step_type="tool", tool_name="recruiter_msg_generate",
                 param_refs={"profile_data": "check_profile"}, params={"company": "", "role": ""}),
        StepSpec(name="save", step_type="db_write", fn=save),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
