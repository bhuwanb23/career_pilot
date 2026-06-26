"""Generate sample resume PDFs for testing."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import fitz

SAMPLES_DIR = Path(__file__).resolve().parent.parent / "samples"
SAMPLES_DIR.mkdir(exist_ok=True)


def create_resume(name, email, phone, city, skills, experience, education, filename):
    doc = fitz.open()
    page = doc.new_page()
    y = 750

    page.insert_text((72, y), name, fontsize=16, fontname="helv")
    y -= 20
    page.insert_text((72, y), f"{email} | {phone} | {city}", fontsize=10)
    y -= 30

    page.insert_text((72, y), "SKILLS", fontsize=12, fontname="helv")
    y -= 15
    page.insert_text((72, y), skills, fontsize=10)
    y -= 30

    page.insert_text((72, y), "EXPERIENCE", fontsize=12, fontname="helv")
    y -= 15
    for exp in experience:
        page.insert_text((72, y), exp["title"], fontsize=10, fontname="helv")
        y -= 15
        for bullet in exp["bullets"]:
            page.insert_text((72, y), f"- {bullet}", fontsize=10)
            y -= 15
        y -= 10

    y -= 10
    page.insert_text((72, y), "EDUCATION", fontsize=12, fontname="helv")
    y -= 15
    for edu in education:
        page.insert_text((72, y), edu, fontsize=10)
        y -= 15

    doc.save(str(SAMPLES_DIR / filename))
    doc.close()
    print(f"Created {filename}")


if __name__ == "__main__":
    create_resume(
        name="John Doe",
        email="john@example.com",
        phone="555-0123",
        city="San Francisco, CA",
        skills="Python, JavaScript, React, Node.js, SQL, FastAPI, Git, Docker",
        experience=[
            {
                "title": "Software Engineer | TechCorp | 2022-2024",
                "bullets": [
                    "Built REST APIs serving 10K+ daily requests",
                    "Reduced load time by 40% through code optimization",
                    "Led migration from monolith to microservices",
                ],
            },
            {
                "title": "Frontend Developer | StartupXYZ | 2020-2022",
                "bullets": [
                    "Developed React dashboard used by 5K+ users",
                    "Implemented real-time notifications with WebSockets",
                ],
            },
        ],
        education=[
            "BS Computer Science | UC Berkeley | 2020",
        ],
        filename="sample_resume_john.pdf",
    )

    create_resume(
        name="Jane Smith",
        email="jane@example.com",
        phone="555-0456",
        city="New York, NY",
        skills="Python, Machine Learning, TensorFlow, PyTorch, SQL, AWS, Pandas",
        experience=[
            {
                "title": "ML Engineer | DataCo | 2021-2024",
                "bullets": [
                    "Built recommendation system increasing engagement by 25%",
                    "Deployed NLP models processing 1M+ documents daily",
                    "Fine-tuned LLMs for domain-specific tasks",
                ],
            },
        ],
        education=[
            "MS Data Science | Columbia University | 2021",
            "BS Mathematics | NYU | 2019",
        ],
        filename="sample_resume_jane.pdf",
    )

    print("All samples generated.")
