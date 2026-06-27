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
        channel = "cold outreach"
    return StepResult(success=True, data=channel)


async def llm_generate(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    from services.recruiter_msg import generate_recruiter_msg
    profile_dict = profile_to_dict(ctx["check_profile"])
    app = ctx["check_app"]
    channel = ctx["parse_channel"]
    message_text = await generate_recruiter_msg(profile_dict, app.company, app.role, channel)
    return StepResult(success=True, data=message_text)


async def save(ctx, db, **kw):
    app = ctx["check_app"]
    app.recruiter_msg = ctx["llm_generate"]
    db.commit()
    return StepResult(success=True)


async def respond(ctx, db, **kw):
    app = ctx["check_app"]
    channel = ctx["parse_channel"]
    message_text = ctx["llm_generate"]
    text = f"Recruiter message for **{app.company}** ({channel}):\n\n{message_text}"
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "recruiter_msg_generated", "data": {"application_id": app.id}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="generate_recruiter_msg", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="check_app", step_type="check", fn=check_app),
        StepSpec(name="parse_channel", step_type="prepare", fn=parse_channel, params={"user_msg": user_msg}),
        StepSpec(name="llm_generate", step_type="llm_call", fn=llm_generate),
        StepSpec(name="save", step_type="db_write", fn=save),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
