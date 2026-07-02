import re
from services.workflow import StepResult, StepSpec, Workflow


async def extract_and_save(ctx, db, **kw):
    user_msg = kw["user_msg"]
    msg_lower = user_msg.lower()
    updates = {}

    if any(w in msg_lower for w in ["skill", "technologies", "tech stack"]):
        after_skill = re.split(r'(?:skills?|technologies|tech\s*stack)\s*(?:to\s+include|:|to)\s*', user_msg, flags=re.IGNORECASE)
        if len(after_skill) > 1:
            raw = after_skill[-1]
        else:
            raw = re.sub(r'.*(?:add|update|set|change)\s+(?:my\s+)?(?:skills?|technologies)\s*(?:to|:)?\s*', '', user_msg, flags=re.IGNORECASE)

        stop_words = {"and", "the", "my", "to", "include", "with", "add", "update", "set", "change", "or", "also", "like", "i", "want", "need", "should"}
        skills = re.split(r',|\band\b', raw)
        skills = [s.strip().strip('.!?') for s in skills if s.strip() and len(s.strip()) > 1 and s.strip().lower() not in stop_words]
        if skills:
            updates["skills"] = skills

    if any(w in msg_lower for w in ["summary", "about me", "describe"]):
        summary = re.sub(r'.*(?:summary|about\s+me|describe)\s*(?:me|myself)?\s*:?\s*', '', user_msg, flags=re.IGNORECASE).strip()
        if summary:
            updates["summary"] = summary

    personal = {}
    email_match = re.search(r'[\w.-]+@[\w.-]+\.\w+', user_msg)
    if email_match:
        personal["email"] = email_match.group(0)

    phone_match = re.search(r'(?:phone|tel|number)\s*(?:is|:)?\s*([\d\s\-\+()]+)', user_msg, re.IGNORECASE)
    if phone_match and len(phone_match.group(1).strip()) >= 7:
        personal["phone"] = phone_match.group(1).strip()

    location_match = re.search(r'(?:location|based in|located in|city)\s*(?:is|:)?\s*([A-Z][a-zA-Z\s,]+)', user_msg)
    if location_match:
        personal["location"] = location_match.group(1).strip()

    if personal:
        updates["personal"] = personal

    if not updates:
        return StepResult(success=False, error=(
            "I couldn't parse what to update. Try:\n"
            "- 'Update my skills to include Python, Go, and Rust'\n"
            "- 'Add Docker and Kubernetes to my skills'\n"
            "- 'Change my summary to Senior full-stack developer'\n"
            "- 'Set my email to user@example.com'"
        ))

    from services.profile_service import create_or_update_profile, get_profile
    existing = get_profile(db)
    if existing and updates.get("skills"):
        existing_skills = existing.get_skills() if hasattr(existing, 'get_skills') else []
        combined = list(dict.fromkeys(existing_skills + updates["skills"]))
        updates["skills"] = combined

    profile = create_or_update_profile(db, updates)
    return StepResult(success=True, data={"profile": profile, "updates": updates})


async def respond(ctx, db, **kw):
    data = ctx["extract_and_save"]
    profile = data["profile"]
    updates = data["updates"]

    from services.profile_service import profile_to_dict
    pd = profile_to_dict(profile)

    changed = []
    if updates.get("skills"):
        changed.append(f"Skills: {', '.join(pd.get('skills', [])[:20])}")
    if updates.get("summary"):
        changed.append(f"Summary: {(pd.get('summary') or '')[:120]}")
    if updates.get("personal"):
        p = pd.get("personal", {})
        parts = [f"{k}: {v}" for k, v in p.items() if v]
        if parts:
            changed.append(f"Profile: {', '.join(parts)}")

    text = "Profile updated!\n\n" + "\n".join(f"- {c}" for c in changed)

    ws = kw.get("websocket")
    if ws:
        await ws.send_json({"type": "assistant_text", "content": text})
        await ws.send_json({"type": "action", "action_type": "profile_updated", "data": {}})
    return StepResult(success=True, data=text)


def get_workflow(user_msg, websocket):
    return Workflow(name="update_profile", steps=[
        StepSpec(name="extract_and_save", step_type="db_write", fn=extract_and_save, params={"user_msg": user_msg}),
        StepSpec(name="respond", step_type="respond", fn=respond, params={"websocket": websocket}),
    ])
