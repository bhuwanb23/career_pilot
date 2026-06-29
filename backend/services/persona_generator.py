import json
import logging

from services.llm_client import generate
from services.llm_utils import parse_llm_json

logger = logging.getLogger(__name__)

DEFAULT_PERSONAS = [
    "Backend Engineer", "Frontend Engineer", "Full Stack Engineer",
    "AI/ML Engineer", "Data Engineer",
]

SYSTEM_PROMPT = """You are CareerPilot, an AI career analyst.
Analyze the career profile and generate tailored career personas.
Each persona represents a different career direction the person could pursue.

Return ONLY a JSON array of persona objects, no markdown fences. Each persona:
{
  "persona_name": "Role Type Name",
  "match_confidence": 0.0-1.0,
  "ai_summary": "2-3 sentence persona-specific narrative emphasizing relevant experience",
  "highlighted_skills": ["skills most relevant to this direction"],
  "strengths": ["strengths framed for this role type"],
  "missing_skills": ["skills needed but not yet demonstrated"],
  "suggested_focus": ["actionable steps to build toward this path"],
  "experience_level_label": "junior|mid-senior|senior|lead",
  "target_role_types": ["specific job titles this persona targets"]
}

Be specific and data-driven. Match confidence should reflect how well the existing experience aligns with each direction."""


async def generate_personas(profile_data: dict, persona_names: list[str] = None) -> list[dict]:
    names = persona_names or DEFAULT_PERSONAS

    prompt = f"""Analyze this career profile and generate {len(names)} career personas.

Career Data:
{json.dumps(profile_data, indent=2)[:8000]}

Target personas to evaluate: {', '.join(names)}

For EACH persona listed above, generate a persona object with the schema provided.
Return a JSON array containing exactly {len(names)} persona objects."""

    response = await generate(prompt, system=SYSTEM_PROMPT)

    try:
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
        if cleaned.endswith("```"):
            cleaned = cleaned.rsplit("```", 1)[0]
        personas = json.loads(cleaned.strip())
        if not isinstance(personas, list):
            personas = [personas]
        return personas
    except (json.JSONDecodeError, TypeError):
        logger.warning("Failed to parse persona response, returning empty list")
        return []
