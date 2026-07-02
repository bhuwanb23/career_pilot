import json
import re
from services.workflow import StepResult, StepSpec, Workflow


EXTRACT_PROMPT = """Extract profile update fields from the user message. Return ONLY valid JSON.

If the message is about SKILLS: return {"skills": ["skill1", "skill2"]}
If the message is about SUMMARY: return {"summary": "<the actual summary text from the message>"}
If the message is about EMAIL: return {"personal": {"email": "<the actual email>"}}
If the message is about PHONE: return {"personal": {"phone": "<the actual phone number>"}}
If the message is about LOCATION: return {"personal": {"location": "<the actual location>"}}
If the message contains MULTIPLE fields: combine them in one JSON object.

Rules:
- For skills: extract ONLY clean skill names, no verbs or filler words
- For email/phone/location: extract the actual value from the message, not placeholders
- Return {} if nothing actionable found"""


def _regex_fallback(user_msg: str) -> dict:
    """Fast regex extraction for simple patterns that the 1B model often misses."""
    updates = {}
    msg_lower = user_msg.lower()

    # Summary
    if any(w in msg_lower for w in ["summary", "about me", "describe"]):
        summary = re.sub(r'.*(?:summary|about\s+me|describe)\s*(?:me|myself)?\s*(?:to|as|:)?\s*', '', user_msg, flags=re.IGNORECASE).strip()
        if summary and len(summary) >= 10:
            updates["summary"] = summary

    # Email
    email_match = re.search(r'[\w.+-]+@[\w.-]+\.\w+', user_msg)
    if email_match:
        updates.setdefault("personal", {})["email"] = email_match.group(0)

    # Phone
    if any(w in msg_lower for w in ["phone", "tel", "number"]):
        phone_match = re.search(r'[\d\s\-\+()]{7,20}', user_msg)
        if phone_match:
            updates.setdefault("personal", {})["phone"] = phone_match.group(0).strip()

    # Location
    if any(w in msg_lower for w in ["location", "based in", "city"]):
        loc_match = re.search(r'(?:location|based in|city)\s*(?:is|:)?\s*(.+?)(?:\.|$)', user_msg, re.IGNORECASE)
        if loc_match:
            updates.setdefault("personal", {})["location"] = loc_match.group(1).strip()

    return updates


async def extract_via_llm(ctx, db, **kw):
    user_msg = kw["user_msg"]

    # Try regex first for simple patterns
    regex_result = _regex_fallback(user_msg)
    if regex_result:
        # Regex found something — use it directly (more reliable than LLM for these)
        return StepResult(success=True, data=regex_result)

    # For complex extractions (skills, summary), use the LLM
    from services.llm_client import generate
    from services.llm_utils import parse_llm_json

    prompt = f'User message: "{user_msg}"\n\nExtract update fields as JSON:'
    try:
        response = await generate(prompt, system=EXTRACT_PROMPT)
        updates = parse_llm_json(response, {})
    except Exception:
        updates = {}

    if not updates:
        return StepResult(success=False, error=(
            "I couldn't understand what to update. Try:\n"
            "- 'Add Kubernetes and Terraform to my skills'\n"
            "- 'Set my email to user@example.com'\n"
            "- 'Change my summary to Senior full-stack developer'"
        ))

    # Validate skills are clean
    if "skills" in updates and isinstance(updates["skills"], list):
        updates["skills"] = [
            s for s in updates["skills"]
            if isinstance(s, str) and len(s) > 1 and len(s) < 50
        ]

    # Validate summary is meaningful
    if "summary" in updates:
        summary = updates["summary"]
        if not isinstance(summary, str) or len(summary.strip()) < 10:
            del updates["summary"]

    return StepResult(success=True, data=updates)


async def save_and_respond(ctx, db, **kw):
    updates = ctx["extract_via_llm"]
    from services.profile_service import create_or_update_profile, get_profile, profile_to_dict

    existing = get_profile(db)
    if existing and updates.get("skills"):
        existing_skills = existing.get_skills() if hasattr(existing, 'get_skills') else []
        combined = list(dict.fromkeys(existing_skills + updates["skills"]))
        updates["skills"] = combined

    profile = create_or_update_profile(db, updates)
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
        StepSpec(name="extract_via_llm", step_type="parse", fn=extract_via_llm, params={"user_msg": user_msg}),
        StepSpec(name="save_and_respond", step_type="db_write", fn=save_and_respond),
    ])
