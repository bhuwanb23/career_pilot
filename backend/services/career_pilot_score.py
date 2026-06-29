"""
CareerPilot Score System

Computes a comprehensive score across 4 dimensions:
- Fit: How well the candidate's profile matches the JD
- Timing: Whether application timing is optimal
- Competition: Market competition level for the role
- Readiness: How prepared the candidate is for the role
"""

from datetime import datetime, timezone


def compute_fit_score(profile: dict, jd_data: dict) -> float:
    """
    Compute fit score based on skill and experience matching.
    Returns a score between 0 and 100.
    """
    if not profile or not jd_data:
        return 50.0

    profile_skills = set(s.lower() for s in profile.get("skills", []))
    jd_skills = set()

    # Extract skills from job description
    jd_text = jd_data.get("job_description", "").lower()
    common_tech = [
        "python", "javascript", "typescript", "react", "node", "angular", "vue",
        "java", "c++", "go", "rust", "sql", "nosql", "mongodb", "postgresql",
        "aws", "azure", "gcp", "docker", "kubernetes", "git", "ci/cd",
        "agile", "scrum", "rest", "graphql", "api", "microservices",
        "machine learning", "ai", "data science", "analytics",
    ]

    for tech in common_tech:
        if tech in jd_text:
            jd_skills.add(tech)

    if not jd_skills:
        return 70.0  # Default score when no skills extractable

    matched = profile_skills.intersection(jd_skills)
    match_ratio = len(matched) / len(jd_skills) if jd_skills else 0

    # Experience bonus
    experience = profile.get("experience", [])
    exp_years = len(experience) * 2  # Rough estimate
    exp_bonus = min(15, exp_years * 2)

    score = (match_ratio * 70) + exp_bonus
    return min(100, max(0, score))


def compute_timing_score(application: dict) -> float:
    """
    Compute timing score based on application recency and market factors.
    Returns a score between 0 and 100.
    """
    if not application:
        return 50.0

    created_at = application.get("created_at")
    if not created_at:
        return 50.0

    try:
        if isinstance(created_at, str):
            app_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        else:
            app_date = created_at

        days_ago = (datetime.now(timezone.utc) - app_date).days

        # Optimal timing: 1-14 days ago scores highest
        if days_ago <= 3:
            score = 90
        elif days_ago <= 7:
            score = 85
        elif days_ago <= 14:
            score = 75
        elif days_ago <= 30:
            score = 60
        else:
            score = 40

        return float(score)
    except Exception:
        return 50.0


def compute_competition_score(jd_data: dict) -> float:
    """
    Compute competition score based on role characteristics.
    Higher score = less competition (easier to get).
    Returns a score between 0 and 100.
    """
    if not jd_data:
        return 50.0

    jd_text = jd_data.get("job_description", "").lower()
    role = jd_data.get("role", "").lower()

    score = 65  # Base score

    # Senior roles tend to have less competition
    if "senior" in role or "lead" in role or "principal" in role:
        score += 10

    # Remote roles tend to have more competition
    if "remote" in jd_text:
        score -= 10

    # Specialized skills reduce competition
    specialized = ["kubernetes", "terraform", "rust", "go", "cobol", "mainframe"]
    for skill in specialized:
        if skill in jd_text:
            score += 5
            break

    # Common skills increase competition
    common = ["javascript", "python", "react", "node"]
    common_count = sum(1 for s in common if s in jd_text)
    score -= common_count * 2

    return min(100, max(0, score))


def compute_readiness_score(profile: dict, jd_data: dict) -> float:
    """
    Compute readiness score based on profile completeness and preparation.
    Returns a score between 0 and 100.
    """
    if not profile:
        return 30.0

    score = 40  # Base score

    # Profile completeness factors
    if profile.get("summary"):
        score += 10
    if profile.get("skills") and len(profile.get("skills", [])) >= 5:
        score += 15
    if profile.get("experience") and len(profile.get("experience", [])) >= 2:
        score += 15
    if profile.get("projects") and len(profile.get("projects", [])) >= 1:
        score += 10
    if profile.get("education"):
        score += 5

    # Cap at 100
    return min(100, max(0, score))


def compute_career_pilot_score(profile: dict, jd_data: dict, application: dict = None) -> dict:
    """
    Compute the complete CareerPilot Score.
    Returns a dict with all 4 dimensions and an overall score.
    """
    fit = compute_fit_score(profile, jd_data)
    timing = compute_timing_score(application)
    competition = compute_competition_score(jd_data)
    readiness = compute_readiness_score(profile, jd_data)

    # Overall score is weighted average
    overall = round((fit * 0.4 + readiness * 0.3 + timing * 0.15 + competition * 0.15), 1)

    return {
        "fit": round(fit, 1),
        "timing": round(timing, 1),
        "competition": round(competition, 1),
        "readiness": round(readiness, 1),
        "overall": round(overall, 1),
    }
