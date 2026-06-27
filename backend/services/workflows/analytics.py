from services.workflow import StepResult, StepSpec, Workflow


async def query_stats(ctx, db, **kw):
    from services.analytics import get_raw_analytics
    raw = get_raw_analytics(db)
    return StepResult(success=True, data=raw)


async def llm_narrative(ctx, db, **kw):
    raw = ctx["query_stats"]
    if raw["total_applications"] == 0:
        raw["narrative"] = "No applications yet. Start by analyzing a job description!"
        return StepResult(success=True, data=raw)
    from services.analytics import get_analytics_summary
    result = await get_analytics_summary(db)
    return StepResult(success=True, data=result)


async def respond(ctx, db, **kw):
    analytics = ctx["llm_narrative"]
    total = analytics["total_applications"]
    avg = analytics["avg_match_score"]
    narrative = analytics.get("narrative", "")

    text = f"**Your Job Search Dashboard**\n\n"
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

    await kw["websocket"].send_json({"type": "assistant_text", "content": text})
    await kw["websocket"].send_json({"type": "action", "action_type": "show_analytics", "data": analytics})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="placement_analytics", steps=[
        StepSpec(name="query_stats", step_type="check", fn=query_stats),
        StepSpec(name="llm_narrative", step_type="llm_call", fn=llm_narrative),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
