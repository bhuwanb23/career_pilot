"""Live REST chat smoke tests against running server + Ollama."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx

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


print("1. Health Check")
r = httpx.get(f"{BASE}/api/health", timeout=10)
test("Health returns 200", r.status_code == 200)
test("LLM connected", r.json().get("llm") is True)

print("\n2. REST Chat — hello")
r = httpx.post(f"{BASE}/api/chat", json={"content": "hello"}, timeout=180)
test("Chat hello returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")
session_id = None
if r.status_code == 200:
    data = r.json()
    session_id = data.get("session_id")
    test("Has session_id", session_id is not None)
    test("Has response text", len(data.get("response", "")) > 0)
    test("Intent is general_chat", data.get("intent") == "general_chat")

print("\n3. Upload Resume (for profile workflow)")
pdf_path = SAMPLES / "sample_resume_john.pdf"
if pdf_path.exists():
    with open(pdf_path, "rb") as f:
        r = httpx.post(
            f"{BASE}/api/resume/upload",
            files={"file": ("resume.pdf", f, "application/pdf")},
            timeout=180,
        )
    test("Upload returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")
else:
    print("  [SKIP] sample resume not found")

print("\n4. REST Chat — show my profile")
r = httpx.post(
    f"{BASE}/api/chat",
    json={"content": "show my profile", "session_id": session_id},
    timeout=180,
)
test("Show profile returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")
if r.status_code == 200:
    data = r.json()
    test("Intent is show_profile", data.get("intent") == "show_profile")
    resp = data.get("response", "").lower()
    test("Response mentions skills or profile", "skill" in resp or "profile" in resp or "summary" in resp)

print("\n5. REST Chat — analyze job")
r = httpx.post(
    f"{BASE}/api/chat",
    json={
        "content": "Analyze this job: Frontend Developer with React, TypeScript, and Node.js experience.",
        "session_id": session_id,
    },
    timeout=300,
)
test("Analyze job returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:300]}")
if r.status_code == 200:
    data = r.json()
    test("Intent is analyze_job", data.get("intent") == "analyze_job")
    test("Response has content", len(data.get("response", "")) > 0)

print("\n6. REST Chat — goal message (store_goal path)")
r = httpx.post(
    f"{BASE}/api/chat",
    json={"content": "I want to become a senior frontend engineer", "session_id": session_id},
    timeout=180,
)
test("Goal message returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")
if r.status_code == 200:
    test("Goal response has content", len(r.json().get("response", "")) > 0)

print("\n7. REST Chat — preference message (store_preference path)")
r = httpx.post(
    f"{BASE}/api/chat",
    json={"content": "I prefer remote work", "session_id": session_id},
    timeout=180,
)
test("Preference message returns 200", r.status_code == 200, f"{r.status_code}: {r.text[:200]}")

print(f"\n{'=' * 40}")
print(f"Results: {passed} passed, {failed} failed")
print(f"{'=' * 40}")
sys.exit(1 if failed else 0)
