import json
import re
from services.workflow import StepResult, StepSpec, Workflow


async def extract_updates(ctx, db, **kw):
    user_msg = kw["user_msg"]
    from services.llm_client import generate

    prompt = f"""Extract profile update fields from this user message. Return ONLY valid JSON.

User message: "{user_msg}"

Return format:
{{"summary": "...", "skills": [...], "experience": [...], "education": [...], "projects": [...], "personal": {{"name": "...", "email": "...", "phone": "...", "location": "..."}}}}

Only include fields the user explicitly wants to change. Use null for unchanged fields.
For skills, return the FULL new list of skills (not just additions).
If the user says "add X to my skills", you need to know existing skills from context.
Just extract what the user explicitly stated. Return null for anything not mentioned."""

    try:
        response = await generate(prompt, system="You extract structured data from user messages. Return only JSON.")
        response = response.strip()
        if response.startswith("```"):
            response = response.split("\n", 1)[1]
        if response.endswith("```"):
            response = response.rsplit("```", 1)[0]
        updates = json.loads(response.strip())
    except Exception:
        updates = {}

    if not updates:
        if "skill" in user_msg.lower():
            skills = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', user_msg)
            if not skills:
                skills = re.findall(r'[A-Za-z+#.]+', user_msg)
                skills = [s for s in skills if len(s) > 1 and s.lower() not in {"add", "skills", "my", "to", "include", "and", "the", "with"}]
            updates = {"skills": skills}
        elif "summary" in user_msg.lower():
            updates = {"summary": re.sub(r'.*(?:summary|about|describe)\s*(?:me|myself)?\s*:?\s*', '', user_msg, flags=re.IGNORECASE).strip()}
        else:
            updates = {}

    if not updates:
        return StepResult(success=False, error="I couldn't understand what you'd like to update. Try something like:\n- 'Update my skills to include Python and Go'\n- 'Change my summary to...'\n- 'Add my email as user@example.com'")

    return StepResult(success=True, data=updates)


async def save_updates(ctx, db, **kw):
    from services.profile_service import create_or_update_profile, get_profile
    updates = ctx["extract_updates"]

    existing = get_profile(db)
    if existing and updates.get("skills"):
        existing_skills = existing.get_skills() if hasattr(existing, 'get_skills') else []
        new_skills = updates["skills"]
        combined = list(dict.fromkeys(existing_skills + new_skills))
        updates["skills"] = combined

    profile = create_or_update_profile(db, updates)
    return StepResult(success=True, data=profile)


async def respond(ctx, db, **kw):
    from services.profile_service import profile_to_dict
    profile = ctx["save_updates"]
    data = profile_to_dict(profile)
    updates = ctx["extract_updates"]

    changed = []
    if updates.get("skills"):
        changed.append(f"Skills: {', '.join(data.get('skills', [])[:15])}")
    if updates.get("summary"):
        changed.append(f"Summary: {(data.get('summary') or '')[:100]}...")
    if updates.get("personal"):
        p = data.get("personal", {})
        parts = [f"{k}: {v}" for k, v in p.items() if v]
        if parts:
            changed.append(f"Personal: {', '.join(parts[:5])}")

    text = "Profile updated successfully!\n\n" + "\n".join(f"- {c}" for c in changed) if changed else "Profile updated successfully!"

    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "show_profile", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="update_profile", steps=[
        StepSpec(name="extract_updates", step_type="parse", fn=extract_updates, params={"user_msg": user_msg}),
        StepSpec(name="save_updates", step_type="db_write", fn=save_updates),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
