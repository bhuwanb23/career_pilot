#!/usr/bin/env python3
"""Smoke test CareerPilot agent chat endpoints (requires running backend + Ollama optional)."""

import json
import sys

import httpx

BASE = "http://localhost:8000"

SCENARIOS = [
    ("Show my profile", ["profile", "navigate"]),
    ("List my applications", ["applications", "kanban"]),
    ("Show my analytics", ["analytics"]),
    ("Show overdue outreach", ["outreach", "due"]),
    ("Prepare interview prep", ["interview", "prep"]),
    ("Analyze this job: React developer with 3 years experience at Acme Corp", ["application", "match"]),
]


def run_scenario(client: httpx.Client, message: str, keywords: list[str]) -> bool:
    try:
        r = client.post("/api/chat", json={"content": message}, timeout=120.0)
        if r.status_code == 503:
            print(f"  SKIP (LLM offline): {message}")
            return True
        r.raise_for_status()
        data = r.json()
        text = json.dumps(data).lower()
        ok = any(kw in text for kw in keywords)
        print(f"  {'PASS' if ok else 'FAIL'}: {message}")
        if not ok:
            print(f"    response keys: {list(data.keys())}")
        return ok
    except Exception as e:
        print(f"  ERROR: {message} — {e}")
        return False


def main() -> int:
    print(f"CareerPilot agent smoke test → {BASE}\n")
    try:
        health = httpx.get(f"{BASE}/api/health", timeout=5.0)
        health.raise_for_status()
        print(f"Health: {health.json()}\n")
    except Exception as e:
        print(f"Backend not reachable at {BASE}: {e}")
        return 1

    passed = 0
    with httpx.Client(base_url=BASE) as client:
        for message, keywords in SCENARIOS:
            if run_scenario(client, message, keywords):
                passed += 1

    total = len(SCENARIOS)
    print(f"\n{passed}/{total} scenarios passed")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
