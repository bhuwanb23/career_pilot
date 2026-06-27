import json
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Application
from services.llm_client import generate


def get_raw_analytics(db: Session) -> dict:
    total = db.query(func.count(Application.id)).scalar() or 0

    status_rows = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )
    status_breakdown = {status: count for status, count in status_rows}

    avg_score = db.query(func.avg(Application.match_score)).scalar() or 0.0

    score_ranges = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
    all_scores = db.query(Application.match_score).all()
    for (score,) in all_scores:
        pct = score * 100
        if pct < 20:
            score_ranges["0-20%"] += 1
        elif pct < 40:
            score_ranges["20-40%"] += 1
        elif pct < 60:
            score_ranges["40-60%"] += 1
        elif pct < 80:
            score_ranges["60-80%"] += 1
        else:
            score_ranges["80-100%"] += 1

    top_companies = (
        db.query(Application.company, func.count(Application.id))
        .group_by(Application.company)
        .order_by(func.count(Application.id).desc())
        .limit(5)
        .all()
    )

    top_roles = (
        db.query(Application.role, func.count(Application.id))
        .group_by(Application.role)
        .order_by(func.count(Application.id).desc())
        .limit(5)
        .all()
    )

    best_match = (
        db.query(Application.company, Application.role, Application.match_score)
        .order_by(Application.match_score.desc())
        .first()
    )

    worst_match = (
        db.query(Application.company, Application.role, Application.match_score)
        .order_by(Application.match_score.asc())
        .first()
    )

    return {
        "total_applications": total,
        "status_breakdown": status_breakdown,
        "avg_match_score": round(float(avg_score), 2),
        "score_distribution": score_ranges,
        "top_companies": [{"company": c, "count": n} for c, n in top_companies],
        "top_roles": [{"role": r, "count": n} for r, n in top_roles],
        "best_match": {
            "company": best_match[0],
            "role": best_match[1],
            "score": round(float(best_match[2]), 2),
        } if best_match else None,
        "worst_match": {
            "company": worst_match[0],
            "role": worst_match[1],
            "score": round(float(worst_match[2]), 2),
        } if worst_match else None,
    }


async def get_analytics_summary(db: Session) -> dict:
    raw = get_raw_analytics(db)

    if raw["total_applications"] == 0:
        raw["narrative"] = "No applications yet. Start by analyzing a job description!"
        return raw

    prompt = f"""Here are the user's job application analytics:
{json.dumps(raw, indent=2)}

Write a brief, encouraging narrative summary (3-4 sentences) of their job search progress.
Highlight strengths, patterns, and one actionable suggestion. Be specific with numbers."""

    system = "You are CareerPilot, a career analytics advisor. Be concise and data-driven."
    narrative = await generate(prompt, system=system)
    raw["narrative"] = narrative.strip()

    return raw
