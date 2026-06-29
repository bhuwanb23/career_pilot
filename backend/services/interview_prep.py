import json

from services.llm_client import generate
from services.llm_utils import parse_llm_json

VALID_CATEGORIES = {"hr", "technical", "behavioral", "role", "company"}

SYSTEM_PROMPT = """You are CareerPilot, an AI career interview coach.
Generate comprehensive interview preparation material for the given role and company.
Return ONLY valid JSON matching this exact schema, no markdown fences:
{
  "company_intel": {
    "overview": "Company overview paragraph",
    "products": "Products and services",
    "tech_stack": "Technologies and tools used",
    "role_expectations": "What this role entails",
    "culture": "Company culture and values",
    "recent_news": "Recent news or trends (inferred from JD if unknown)"
  },
  "questions": [
    {"question": "Interview question", "answer": "Suggested answer", "category": "hr|technical|behavioral|role|company"}
  ],
  "star_answers": [
    {
      "theme": "Tell me about yourself / Leadership / Conflict resolution etc",
      "situation": "Brief context",
      "task": "Your responsibility",
      "action": "What you did",
      "result": "Outcome with metrics if possible"
    }
  ],
  "prep_notes": {
    "topics_to_revise": ["topic1", "topic2"],
    "important_skills": ["skill1", "skill2"],
    "resume_highlights": ["highlight1", "highlight2"],
    "questions_to_ask": ["question for interviewer"],
    "checklist": ["Last-minute prep item"]
  },
  "ai_suggestions": [
    {"text": "Specific preparation tip", "priority": "high|medium|low", "category": "technical|behavioral|resume|general"}
  ]
}
Generate 8-10 questions across hr, technical, behavioral, role, and company categories.
Generate 3-4 STAR answers with distinct themes based on the candidate's experience.
Provide 4-6 actionable AI suggestions."""

FALLBACK = {
    "company_intel": {},
    "questions": [],
    "star_answers": [],
    "prep_notes": {},
    "ai_suggestions": [],
}


def normalize_prep_result(raw: dict) -> dict:
    if not raw:
        return dict(FALLBACK)

    company_intel = raw.get("company_intel") or {}
    if isinstance(company_intel, str):
        company_intel = {"overview": company_intel}

    overview = company_intel.get("overview") or raw.get("company_summary", "")
    if not overview:
        parts = [
            company_intel.get("products"),
            company_intel.get("role_expectations"),
            company_intel.get("culture"),
        ]
        overview = " ".join(p for p in parts if p)
    company_intel.setdefault("overview", overview)
    for key in ("products", "tech_stack", "role_expectations", "culture", "recent_news"):
        company_intel.setdefault(key, "")

    questions = []
    for q in raw.get("questions") or []:
        if not isinstance(q, dict):
            continue
        cat = str(q.get("category", "behavioral")).lower()
        if cat not in VALID_CATEGORIES:
            cat = "behavioral"
        questions.append({
            "question": q.get("question", ""),
            "answer": q.get("answer", ""),
            "category": cat,
        })

    star_answers = []
    for s in raw.get("star_answers") or []:
        if not isinstance(s, dict):
            continue
        star_answers.append({
            "theme": s.get("theme", "Behavioral question"),
            "situation": s.get("situation", ""),
            "task": s.get("task", ""),
            "action": s.get("action", ""),
            "result": s.get("result", ""),
        })

    prep_notes = raw.get("prep_notes") or {}
    if isinstance(prep_notes, str):
        prep_notes = {"topics_to_revise": [prep_notes]}
    for key in ("topics_to_revise", "important_skills", "resume_highlights", "questions_to_ask", "checklist"):
        val = prep_notes.get(key, [])
        prep_notes[key] = val if isinstance(val, list) else [str(val)] if val else []

    suggestions = []
    for s in raw.get("ai_suggestions") or []:
        if isinstance(s, str):
            suggestions.append({"text": s, "priority": "medium", "category": "general"})
        elif isinstance(s, dict):
            suggestions.append({
                "text": s.get("text", ""),
                "priority": s.get("priority", "medium"),
                "category": s.get("category", "general"),
            })

    return {
        "company_intel": company_intel,
        "company_summary": overview,
        "questions": questions,
        "star_answers": star_answers,
        "prep_notes": prep_notes,
        "ai_suggestions": suggestions,
    }


def prep_to_model_fields(result: dict) -> dict:
    normalized = normalize_prep_result(result)
    return {
        "company_summary": normalized["company_summary"],
        "company_intel": normalized["company_intel"],
        "questions": normalized["questions"],
        "star_answers": normalized["star_answers"],
        "prep_notes": normalized["prep_notes"],
        "ai_suggestions": normalized["ai_suggestions"],
    }


async def generate_prep(
    company: str,
    role: str,
    job_description: str,
    profile_data: dict,
) -> dict:
    prompt = f"""Candidate Profile:
{json.dumps(profile_data, indent=2)}

Company: {company}
Role: {role}
Job Description:
{job_description[:6000]}

Generate comprehensive interview preparation material."""

    response = await generate(prompt, system=SYSTEM_PROMPT)
    raw = parse_llm_json(response, FALLBACK)
    result = normalize_prep_result(raw)
    if not result.get("company_summary"):
        result["company_summary"] = (
            f"Interview preparation for {role} at {company}. "
            "Review the job description and connect your experience to the role requirements."
        )
        result["company_intel"]["overview"] = result["company_summary"]
    return result
