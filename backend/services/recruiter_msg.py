import json

from services.llm_client import generate

SYSTEM_PROMPT = """You are CareerPilot, an expert at writing professional outreach messages.
Write a concise, compelling message for reaching out to a recruiter or hiring manager.
The message should:
- Be under 150 words
- Be platform-appropriate (LinkedIn DM, email, or cold outreach)
- Mention the specific role and company
- Highlight 1-2 key qualifications
- End with a clear ask (call, application, connection)
- Be warm but professional
Return ONLY the message text, no JSON, no markdown fences."""


async def generate_recruiter_msg(
    profile_data: dict,
    company: str,
    role: str,
    channel: str = "linkedin",
) -> str:
    prompt = f"""Candidate Profile:
{json.dumps(profile_data, indent=2)}

Company: {company}
Role: {role}
Channel: {channel}

Write a {channel} outreach message for this position."""

    response = await generate(prompt, system=SYSTEM_PROMPT)
    return response.strip()
