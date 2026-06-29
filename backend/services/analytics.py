import json
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import Application, ApplicationStatus
from services.llm_client import generate

INACTIVE_STATUSES = {ApplicationStatus.REJECTED.value, ApplicationStatus.ARCHIVED.value}


def _effective_score_expr():
    return func.coalesce(
        func.nullif(Application.score_overall, 0),
        Application.match_score * 100,
    )


def get_raw_analytics(db: Session) -> dict:
    total = db.query(func.count(Application.id)).scalar() or 0

    status_rows = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )
    status_breakdown = {status: count for status, count in status_rows}

    avg_score_expr = _effective_score_expr()
    avg_score = db.query(func.avg(avg_score_expr)).scalar() or 0.0

    score_ranges = {"0-20%": 0, "20-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0}
    all_apps = db.query(Application.score_overall, Application.match_score).all()
    for score_overall, match_score in all_apps:
        pct = score_overall if score_overall and score_overall > 0 else (match_score or 0) * 100
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
        db.query(Application.company, Application.role, Application.score_overall, Application.match_score)
        .order_by(_effective_score_expr().desc())
        .first()
    )

    worst_match = (
        db.query(Application.company, Application.role, Application.score_overall, Application.match_score)
        .order_by(_effective_score_expr().asc())
        .first()
    )

    def _score_value(row):
        if not row:
            return 0.0
        so, ms = row[2], row[3]
        return round(float(so if so and so > 0 else (ms or 0) * 100), 2)

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
            "score": _score_value(best_match),
        } if best_match else None,
        "worst_match": {
            "company": worst_match[0],
            "role": worst_match[1],
            "score": _score_value(worst_match),
        } if worst_match else None,
    }


def get_phase6_snapshot(db: Session) -> dict:
    raw = get_raw_analytics(db)
    breakdown = raw["status_breakdown"]

    interviews = breakdown.get(ApplicationStatus.INTERVIEW.value, 0)
    offers = breakdown.get(ApplicationStatus.OFFER.value, 0)
    rejections = breakdown.get(ApplicationStatus.REJECTED.value, 0)
    active = raw["total_applications"] - sum(
        breakdown.get(s, 0) for s in INACTIVE_STATUSES
    )

    return {
        **raw,
        "active_applications": max(active, 0),
        "interviews": interviews,
        "offers": offers,
        "rejections": rejections,
        "avg_career_pilot_score": raw["avg_match_score"],
    }


async def get_analytics_summary(db: Session) -> dict:
    raw = get_phase6_snapshot(db)

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
