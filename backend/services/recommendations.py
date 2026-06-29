"""Rule-based AI recommendations from CareerPilot Score and match analysis."""


def generate_recommendations(
    score: dict,
    match: dict,
    jd_data: dict,
    profile: dict,
) -> list[dict]:
    recs = []

    overall = score.get("overall", 0)
    fit = score.get("fit", 0)
    timing = score.get("timing", 0)
    competition = score.get("competition", 0)
    readiness = score.get("readiness", 0)

    if timing >= 80:
        recs.append({
            "text": "Apply today — your timing score is strong for this posting.",
            "priority": "high",
            "category": "timing",
        })
    elif timing < 50:
        recs.append({
            "text": "This posting may be stale; prioritize fresher listings or follow up directly.",
            "priority": "medium",
            "category": "timing",
        })

    if fit >= 80:
        recs.append({
            "text": "Strong fit — tailor your resume and submit with a personalized cover letter.",
            "priority": "high",
            "category": "fit",
        })
    elif fit < 60:
        recs.append({
            "text": "Moderate fit — highlight transferable skills and address gaps in your cover letter.",
            "priority": "high",
            "category": "fit",
        })

    missing = match.get("missing_skills", [])
    if missing:
        top_missing = missing[:3]
        recs.append({
            "text": f"Add or emphasize these skills: {', '.join(top_missing)}.",
            "priority": "high",
            "category": "skills",
        })

    if competition < 55:
        recs.append({
            "text": "This role appears highly competitive — reach out to a recruiter to stand out.",
            "priority": "medium",
            "category": "competition",
        })

    if readiness < 70:
        recs.append({
            "text": "Complete your profile and generate a cover letter before applying.",
            "priority": "medium",
            "category": "readiness",
        })
    else:
        recs.append({
            "text": "You're application-ready — send a recruiter outreach message after applying.",
            "priority": "medium",
            "category": "readiness",
        })

    role = jd_data.get("role", "").lower()
    if "backend" in role or "python" in role:
        recs.append({
            "text": "Consider using your Backend Engineer persona when tailoring your resume.",
            "priority": "low",
            "category": "persona",
        })
    elif "frontend" in role or "react" in role:
        recs.append({
            "text": "Consider using your Frontend Engineer persona when tailoring your resume.",
            "priority": "low",
            "category": "persona",
        })

    if overall >= 85:
        recs.append({
            "text": f"CareerPilot Score {overall}/100 — this is a top-priority application.",
            "priority": "high",
            "category": "score",
        })

    if not profile.get("projects"):
        recs.append({
            "text": "Add a relevant project showcasing skills from this job description.",
            "priority": "medium",
            "category": "profile",
        })

    return recs[:8]
