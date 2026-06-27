from services.workflow import StepResult, StepSpec, Workflow


async def query_apps(ctx, db, **kw):
    from models import Application
    apps = db.query(Application).order_by(Application.created_at.desc()).all()
    return StepResult(success=True, data=apps)


async def respond(ctx, db, **kw):
    apps = ctx["query_apps"]
    if not apps:
        text = "You don't have any applications yet. Paste a job description and I'll analyze it for you!"
    else:
        counts = {}
        for a in apps:
            counts[a.status] = counts.get(a.status, 0) + 1
        text = f"You have {len(apps)} application(s):\n"
        for status, count in counts.items():
            text += f"- {status.title()}: {count}\n"
    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "show_applications", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="show_applications", steps=[
        StepSpec(name="query_apps", step_type="check", fn=query_apps),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
