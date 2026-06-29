import json
import logging

from services.llm_client import generate
from services.llm_utils import parse_llm_json

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are CareerPilot, an AI career analyst.
Analyze the career profile data and generate an enriched, AI-enhanced version.
Be specific, data-driven, and honest. Infer from the actual resume content.

Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "ai_summary": "Enhanced 2-3 sentence professional summary highlighting key career narrative and value proposition",
  "experience_level": "junior|mid|senior|lead|executive",
  "tech_stack": [
    {"category": "Frontend", "tools": ["React", "TypeScript"]},
    {"category": "Backend", "tools": ["Python", "FastAPI"]},
    {"category": "DevOps", "tools": ["Docker", "Git"]},
    {"category": "Database", "tools": ["PostgreSQL", "Redis"]}
  ],
  "interests": ["AI/ML", "Open Source", "Cloud Architecture"],
  "strengths": ["Strong system design skills", "Full-stack capability"],
  "weaknesses": ["Limited management experience", "No cloud certifications"]
}

Rules:
- experience_level: Infer from years of experience and role seniority
- tech_stack: Group skills by domain (Frontend, Backend, DevOps, Database, AI/ML, Mobile, etc.)
- interests: Infer from projects, technologies used, and career trajectory
- strengths: Identify 3-5 genuine strengths based on demonstrated experience
- weaknesses: Identify 2-3 honest areas for growth (be constructive, not negative)
- ai_summary: Write a compelling professional narrative, not just a list of facts"""

FALLBACK = {
    "ai_summary": "",
    "experience_level": "",
    "tech_stack": [],
    "interests": [],
    "strengths": [],
    "weaknesses": [],
}


async def generate_career_profile(profile_data: dict) -> dict:
    prompt = f"""Analyze this career profile and generate an enriched version.

Career Data:
{json.dumps(profile_data, indent=2)[:6000]}

Generate a comprehensive AI-enhanced career profile."""

    response = await generate(prompt, system=SYSTEM_PROMPT)
    return parse_llm_json(response, FALLBACK)


def profile_needs_generation(profile) -> bool:
    if not profile:
        return False
    if not profile.ai_summary and not profile.experience_level:
        return True
    return False
