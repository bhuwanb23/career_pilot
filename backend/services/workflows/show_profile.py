from services.workflow import StepResult, StepSpec, Workflow


async def check_profile(ctx, db, **kw):
    from services.profile_service import get_profile
    profile = get_profile(db)
    if not profile:
        return StepResult(success=False, error="No career profile found yet. Upload your resume to get started!")
    return StepResult(success=True, data=profile)


async def respond(ctx, db, **kw):
    profile = ctx["check_profile"]
    skills = profile.get_skills()
    text = f"Your career profile:\n\n**Summary:** {profile.summary[:200]}\n\n**Skills:** {', '.join(skills[:10])}"
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "show_profile", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="show_profile", steps=[
        StepSpec(name="check_profile", step_type="check", fn=check_profile),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
