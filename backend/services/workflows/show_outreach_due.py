from services.workflow import StepResult, StepSpec, Workflow


async def fetch_due(ctx, db, **kw):
    from services.followup_cadence import build_due_items
    items = build_due_items(db)
    return StepResult(success=True, data=items)


async def respond(ctx, db, **kw):
    items = ctx["fetch_due"] or []
    if not items:
        text = "No overdue or urgent follow-ups right now. You're on track!"
    else:
        lines = [f"- **{i['company']}** ({i['role']}) — {i['urgency']}" for i in items[:8]]
        text = "Follow-ups needing attention:\n\n" + "\n".join(lines)
    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="show_outreach_due", steps=[
        StepSpec(name="fetch_due", step_type="prepare", fn=fetch_due),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
