"""Test against the live running server."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx
import json

BASE = "http://localhost:8000"
SAMPLES = Path(__file__).resolve().parent.parent / "samples"
passed = 0
failed = 0


def test(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} - {detail}")
        failed += 1


# 1. Health
print("1. Health Check")
r = httpx.get(f"{BASE}/api/health")
test("Health returns 200", r.status_code == 200)
test("Ollama connected", r.json().get("ollama") is True)

# 2. Profile (before upload)
print("\n2. Profile (before upload)")
r = httpx.get(f"{BASE}/api/profile")
test("Profile 404 when empty", r.status_code == 404)

# 3. Upload Resume
print("\n3. Upload Resume")
pdf_path = SAMPLES / "sample_resume_john.pdf"
with open(pdf_path, "rb") as f:
    r = httpx.post(f"{BASE}/api/resume/upload", files={"file": ("resume.pdf", f, "application/pdf")}, timeout=120)
test("Upload returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")
if r.status_code == 200:
    data = r.json()
    test("Profile has ID", data.get("id") is not None)
    test("Raw resume extracted", len(data.get("raw_resume", "")) > 0)

# 4. Get Profile
print("\n4. Get Profile")
r = httpx.get(f"{BASE}/api/profile")
test("Profile returns 200", r.status_code == 200)
if r.status_code == 200:
    data = r.json()
    test("Skills is a list", isinstance(data.get("skills"), list))
    test("Experience is a list", isinstance(data.get("experience"), list))
    test("Education is a list", isinstance(data.get("education"), list))

# 5. Applications (before analysis)
print("\n5. Applications (before analysis)")
r = httpx.get(f"{BASE}/api/applications")
test("Applications list is empty", len(r.json()) == 0)

# 6. Analyze Job
print("\n6. Analyze Job")
r = httpx.post(f"{BASE}/api/jobs/analyze", json={
    "job_description": "We are looking for a Frontend Developer with React, TypeScript, and Node.js experience. Must have 2+ years.",
    "url": "https://example.com/job/123"
}, timeout=120)
test("Job analysis returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:300]}")
app_id = None
if r.status_code == 200:
    data = r.json()
    app_id = data.get("id")
    test("Application has ID", app_id is not None)
    test("Match score is number", isinstance(data.get("match_score"), (int, float)))
    test("Cover letter exists", len(data.get("cover_letter", "")) > 0)
    test("Recruiter msg exists", len(data.get("recruiter_msg", "")) > 0)

# 7. List Applications
print("\n7. List Applications")
r = httpx.get(f"{BASE}/api/applications")
test("Applications list has 1 item", len(r.json()) == 1)

# 8. Get Single Application
print("\n8. Get Single Application")
if app_id:
    r = httpx.get(f"{BASE}/api/applications/{app_id}")
    test("Get application returns 200", r.status_code == 200)

# 9. Update Status
print("\n9. Update Application Status")
if app_id:
    r = httpx.patch(f"{BASE}/api/applications/{app_id}", json={"status": "interview"})
    test("Status update returns 200", r.status_code == 200)
    if r.status_code == 200:
        test("Status is now 'interview'", r.json().get("status") == "interview")

# 10. Interview Prep
print("\n10. Interview Prep")
if app_id:
    r = httpx.post(f"{BASE}/api/interview/prepare/{app_id}", timeout=120)
    test("Interview prep returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:300]}")
    if r.status_code == 200:
        data = r.json()
        test("Company summary exists", len(data.get("company_summary", "")) > 0)
        test("Questions is a list", isinstance(data.get("questions"), list))
        test("STAR answers is a list", isinstance(data.get("star_answers"), list))

# 11. Get Interview Prep
print("\n11. Get Interview Prep")
if app_id:
    r = httpx.get(f"{BASE}/api/interview/{app_id}")
    test("Get prep returns 200", r.status_code == 200)

# 12. Update Notes
print("\n12. Update Interview Notes")
if app_id:
    r = httpx.put(f"{BASE}/api/interview/{app_id}", json={"notes": "Focus on system design"})
    test("Notes update returns 200", r.status_code == 200)
    if r.status_code == 200:
        test("Notes updated", r.json().get("notes") == "Focus on system design")

# 13. Delete Application
print("\n13. Delete Application")
if app_id:
    r = httpx.delete(f"{BASE}/api/applications/{app_id}")
    test("Delete returns 200", r.status_code == 200)
    r = httpx.get(f"{BASE}/api/applications")
    test("Applications list is now empty", len(r.json()) == 0)

# 14. Chat History
print("\n14. Chat History")
r = httpx.get(f"{BASE}/api/chat/history")
test("Chat history returns 200", r.status_code == 200)

# Summary
print(f"\n{'='*40}")
print(f"Results: {passed} passed, {failed} failed")
print(f"{'='*40}")
