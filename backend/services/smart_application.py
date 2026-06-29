"""Smart Application Engine — orchestrates JD parse, match, score, LLM assets, and recommendations."""

import json
from datetime import datetime, timezone

from services.career_pilot_score import compute_career_pilot_score
from services.jd_parser import parse_jd
from services.job_analyzer import analyze_job
from services.recommendations import generate_recommendations
from services.resume_matcher import get_match_summary, match_resume_to_jd


async def run_smart_application(job_description: str, url: str, profile_dict: dict) -> dict:
    jd = parse_jd(job_description, url)
    match = match_resume_to_jd(profile_dict, jd)

    jd_for_score = {
        "job_description": job_description,
        "role": jd.get("role", ""),
    }
    application_stub = {"created_at": datetime.now(timezone.utc).isoformat()}

    score = compute_career_pilot_score(profile_dict, jd_for_score, application_stub)
    llm = await analyze_job(job_description, profile_dict)

    has_cover = bool(llm.get("cover_letter"))
    has_recruiter = bool(llm.get("recruiter_msg"))
    score = compute_career_pilot_score(
        profile_dict,
        jd_for_score,
        application_stub,
        has_cover_letter=has_cover,
        has_recruiter_msg=has_recruiter,
    )

    recs = generate_recommendations(score, match, jd, profile_dict)
    match_analysis = get_match_summary(match)
    if llm.get("match_analysis"):
        match_analysis = f"{match_analysis}\n\n{llm['match_analysis']}"

    match_score = match.get("match_percentage", 0) / 100.0
    if llm.get("match_score"):
        match_score = (match_score + llm["match_score"]) / 2

    return {
        "jd": jd,
        "match": match,
        "score": score,
        "llm": llm,
        "recommendations": recs,
        "company": llm.get("company") or jd.get("company", "Unknown"),
        "role": llm.get("role") or jd.get("role", "Unknown"),
        "match_score": round(match_score, 3),
        "match_analysis": match_analysis,
        "cover_letter": llm.get("cover_letter", ""),
        "recruiter_msg": llm.get("recruiter_msg", ""),
    }


def apply_smart_result_to_application(app, result: dict) -> None:
    """Populate an Application ORM instance from smart application result."""
    app.company = result["company"]
    app.role = result["role"]
    app.match_score = result["match_score"]
    app.match_analysis = result["match_analysis"]
    app.cover_letter = result["cover_letter"]
    app.recruiter_msg = result["recruiter_msg"]

    score = result["score"]
    app.score_fit = score["fit"]
    app.score_timing = score["timing"]
    app.score_competition = score["competition"]
    app.score_readiness = score["readiness"]
    app.score_overall = score["overall"]

    app.set_jd_parsed(result["jd"])
    app.set_match_report(result["match"])
    app.set_recommendations(result["recommendations"])
