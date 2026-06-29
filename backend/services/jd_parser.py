"""
JD Parser Service

Parses job descriptions into structured data for analysis.
Extracts skills, requirements, nice-to-haves, and company info.
"""

import re


def parse_jd(job_description: str, url: str = "") -> dict:
    """
    Parse a job description into structured data.
    Returns a dict with extracted information.
    """
    text = job_description.strip()
    text_lower = text.lower()

    return {
        "raw_text": text,
        "url": url,
        "company": _extract_company(text, url),
        "role": _extract_role(text),
        "skills": _extract_skills(text_lower),
        "requirements": _extract_requirements(text),
        "nice_to_have": _extract_nice_to_have(text_lower),
        "experience_level": _extract_experience_level(text_lower),
        "location": _extract_location(text),
        "is_remote": "remote" in text_lower,
    }


def _extract_company(text: str, url: str) -> str:
    """Extract company name from JD or URL."""
    # Try URL first
    if url:
        match = re.search(r"(?:https?://)?(?:www\.)?([^/]+)", url)
        if match:
            domain = match.group(1).split(".")[0]
            return domain.capitalize()

    # Try common patterns
    patterns = [
        r"(?:about|at|join|company)\s+([A-Z][a-zA-Z\s]+?)(?:\s+is|\s+we|\s+has|\s+—)",
        r"^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:is|has|we)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()

    return "Unknown"


def _extract_role(text: str) -> str:
    """Extract job role/title from JD."""
    patterns = [
        r"(?:position|role|title|looking for|hiring)\s+(?:is\s+)?(?:a\s+)?([A-Z][a-zA-Z\s]+?)(?:\s+at|\s+to|\s+with|\s+who)",
        r"^([A-Z][a-zA-Z\s]+?)(?:\s+at|\s+position|\s+role)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()[:50]

    return "Unknown Role"


def _extract_skills(text_lower: str) -> list:
    """Extract technical skills from JD."""
    known_skills = [
        "python", "javascript", "typescript", "react", "angular", "vue", "node",
        "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin",
        "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "git", "ci/cd", "jenkins", "github actions",
        "agile", "scrum", "kanban",
        "rest", "graphql", "grpc", "api",
        "machine learning", "ai", "data science", "tensorflow", "pytorch",
        "html", "css", "sass", "tailwind",
        "linux", "bash", "powershell",
    ]

    found = []
    for skill in known_skills:
        if skill in text_lower:
            found.append(skill)

    return list(set(found))


def _extract_requirements(text: str) -> list:
    """Extract requirements section from JD."""
    requirements = []

    # Look for requirements section
    patterns = [
        r"(?:requirements|qualifications|what we're looking for)[:\s]*\n(.*?)(?:\n\n|\n(?:nice|benefits|about|what you))",
        r"(?:must have|required)[:\s]*\n(.*?)(?:\n\n|\n(?:nice|benefits|about))",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            items = re.findall(r"[•\-\*]\s*(.+)", match.group(1))
            requirements = [item.strip() for item in items if item.strip()]
            break

    return requirements[:10]


def _extract_nice_to_have(text_lower: str) -> list:
    """Extract nice-to-have qualifications."""
    nice_to_have = []

    patterns = [
        r"(?:nice to have|bonus|preferred|plus)[:\s]*\n(.*?)(?:\n\n|\n(?:benefits|about|what you))",
    ]

    text = text_lower
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            items = re.findall(r"[•\-\*]\s*(.+)", match.group(1))
            nice_to_have = [item.strip() for item in items if item.strip()]
            break

    return nice_to_have[:5]


def _extract_experience_level(text_lower: str) -> str:
    """Extract experience level from JD."""
    if "senior" in text_lower or "lead" in text_lower or "principal" in text_lower:
        return "senior"
    elif "mid" in text_lower or "intermediate" in text_lower:
        return "mid"
    elif "junior" in text_lower or "entry" in text_lower or "associate" in text_lower:
        return "junior"
    return "mid"


def _extract_location(text: str) -> str:
    """Extract location from JD."""
    patterns = [
        r"(?:location|based in|located in|office)\s*[:\-]?\s*([A-Z][a-zA-Z\s,]+?)(?:\.|\n)",
        r"(?:Remote|Hybrid|On-site)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip()[:50]

    return "Not specified"
