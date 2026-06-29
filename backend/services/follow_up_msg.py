import json
from datetime import datetime, timezone

from services.llm_client import generate
from services.recruiter_msg import generate_recruiter_msg

FOLLOW_UP_SYSTEM = """You are CareerPilot, an expert at writing professional follow-up messages.
Write a concise follow-up for a job application where the candidate has not received a response yet.
The message should:
- Be under 150 words
- Reference the original application politely
- Reiterate interest without being pushy
- Be platform-appropriate
Return ONLY the message text, no JSON, no markdown fences."""

THANK_YOU_SYSTEM = """You are CareerPilot, an expert at post-interview thank-you notes.
Write a concise thank-you message after an interview.
The message should:
- Be under 150 words
- Reference the role and company
- Mention a specific topic from the interview if context is provided
- Express continued interest
Return ONLY the message text, no JSON, no markdown fences."""


async def generate_follow_up_msg(
    profile_data: dict,
    company: str,
    role: str,
    *,
    step_type: str = "follow_up",
    channel: str = "linkedin",
    prior_message: str = "",
    days_since_apply: int = 0,
) -> str:
    if step_type == "initial":
        return await generate_recruiter_msg(profile_data, company, role, channel)

    if step_type == "thank_you":
        prompt = f"""Candidate Profile:
{json.dumps(profile_data, indent=2)}

Company: {company}
Role: {role}
Channel: {channel}
Days since application: {days_since_apply}

Write a post-interview thank-you message."""
        response = await generate(prompt, system=THANK_YOU_SYSTEM)
        return response.strip()

    prompt = f"""Candidate Profile:
{json.dumps(profile_data, indent=2)}

Company: {company}
Role: {role}
Channel: {channel}
Days since application: {days_since_apply}
Previous outreach message:
{prior_message or "(none)"}

Write a polite follow-up message — no response received yet."""

    response = await generate(prompt, system=FOLLOW_UP_SYSTEM)
    return response.strip()
