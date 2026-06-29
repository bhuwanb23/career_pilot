"""
Resume Matcher Service

Compares a resume/profile against job requirements to determine match quality.
"""

from services.jd_parser import parse_jd
from services.profile_utils import coerce_string_list


def match_resume_to_jd(profile: dict, jd_data: dict) -> dict:
    """
    Match a career profile against a job description.
    Returns a detailed match analysis.
    """
    if not profile or not jd_data:
        return {
            "match_percentage": 0,
            "matched_skills": [],
            "missing_skills": [],
            "strengths": [],
            "weaknesses": [],
            "recommendation": "Insufficient data for analysis",
        }

    profile_skills = set(s.lower() for s in coerce_string_list(profile.get("skills", [])))
    jd_skills = set(s.lower() for s in jd_data.get("skills", []))

    # Find matched and missing skills
    matched_skills = list(profile_skills.intersection(jd_skills))
    missing_skills = list(jd_skills - profile_skills)

    # Calculate match percentage
    if jd_skills:
        match_percentage = round((len(matched_skills) / len(jd_skills)) * 100, 1)
    else:
        match_percentage = 70.0  # Default when no skills to match

    # Analyze strengths
    strengths = []
    experience = profile.get("experience", [])
    if len(experience) >= 3:
        strengths.append("Strong work experience")
    if len(profile.get("skills", [])) >= 8:
        strengths.append("Diverse skill set")
    if profile.get("projects"):
        strengths.append("Project experience demonstrated")
    if matched_skills:
        strengths.append(f"Matches {len(matched_skills)} required skills")

    # Analyze weaknesses
    weaknesses = []
    if missing_skills:
        weaknesses.append(f"Missing {len(missing_skills)} required skills")
    if len(experience) < 2:
        weaknesses.append("Limited work experience")
    if not profile.get("projects"):
        weaknesses.append("No projects listed")

    # Generate recommendation
    if match_percentage >= 80:
        recommendation = "Strong match - highly recommended to apply"
    elif match_percentage >= 60:
        recommendation = "Good match - consider applying with tailored resume"
    elif match_percentage >= 40:
        recommendation = "Moderate match - may need to strengthen certain areas"
    else:
        recommendation = "Low match - consider other opportunities or upskill first"

    return {
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendation": recommendation,
    }


def get_match_summary(match_result: dict) -> str:
    """Generate a human-readable summary of the match analysis."""
    if not match_result:
        return "No match data available."

    lines = [
        f"Match Score: {match_result['match_percentage']}%",
        "",
        "Matched Skills:",
    ]

    for skill in match_result.get("matched_skills", []):
        lines.append(f"  + {skill}")

    if match_result.get("missing_skills"):
        lines.append("")
        lines.append("Missing Skills:")
        for skill in match_result["missing_skills"]:
            lines.append(f"  - {skill}")

    lines.append("")
    lines.append(f"Recommendation: {match_result.get('recommendation', 'N/A')}")

    return "\n".join(lines)
