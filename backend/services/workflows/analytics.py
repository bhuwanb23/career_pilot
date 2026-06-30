from services.workflow import StepResult, StepSpec, Workflow


async def format_dashboard(ctx, db, **kw):
    analytics = ctx["analytics"]
    total = analytics.get("total_applications", 0)
    avg = analytics.get("avg_match_score", 0)
    narrative = analytics.get("narrative", "")

    text = "**Your Job Search Dashboard**\n\n"
    text += f"Total Applications: **{total}**\n"
    text += f"Average Match Score: **{int(avg * 100)}%**\n\n"

    breakdown = analytics.get("status_breakdown", {})
    if breakdown:
        text += "**Status Breakdown:**\n"
        for status, count in breakdown.items():
            text += f"- {status.title()}: {count}\n"

    top_cos = analytics.get("top_companies", [])
    if top_cos:
        text += f"\n**Top Companies:** {', '.join(c['company'] for c in top_cos[:3])}\n"

    if narrative:
        text += f"\n{narrative}"

    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "show_analytics", "data": analytics})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="placement_analytics", steps=[
        StepSpec(name="analytics", step_type="tool", tool_name="analytics_get"),
        StepSpec(name="respond", step_type="respond", fn=format_dashboard, params={"websocket": websocket}),
    ])
