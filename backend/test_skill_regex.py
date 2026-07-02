import re
import sys
sys.path.insert(0, "D:\\projects\\website\\career_pilot\\backend")

# Simulate what update_profile.py does
def test_extract(user_msg):
    msg_lower = user_msg.lower()
    print(f"Input: {user_msg}")

    if any(w in msg_lower for w in ["skill", "technologies", "tech stack"]):
        after_include = re.split(r'(?:skills?|technologies|tech\s*stack)\s*(?:to\s+include|:)\s*', user_msg, flags=re.IGNORECASE)
        after_to = re.split(r'\bto\s+my\s+skills?\b', user_msg, flags=re.IGNORECASE)

        print(f"  after_include parts: {len(after_include)} -> {after_include}")
        print(f"  after_to parts: {len(after_to)} -> {after_to}")

        raw = ""
        if len(after_include) > 1 and len(after_include[-1].strip()) > 1:
            raw = after_include[-1]
            print(f"  Branch: after_include -> raw='{raw}'")
        elif len(after_to) > 1 and len(after_to[0].strip()) > 1:
            raw = after_to[0]
            print(f"  Branch: after_to -> raw='{raw}'")
        else:
            raw = re.sub(r'.*(?:add|update|set|change|include)\s+(?:my\s+)?(?:new\s+)?(?:skills?|technologies)\s*(?:to|with|:)?\s*', '', user_msg, flags=re.IGNORECASE).strip()
            print(f"  Branch: fallback -> raw='{raw}'")

        stop_words = {"and", "the", "my", "to", "include", "with", "add", "update", "set", "change", "or", "also", "like", "i", "want", "need", "should", "new", "these", "those"}
        parts = re.split(r',|\band\b', raw)
        print(f"  Parts after split: {parts}")

        skills = []
        for p in parts:
            s = p.strip().strip('.!?')
            if not s or len(s) < 2:
                continue
            s = re.sub(r'^(?:add|remove|update|set|change|include)\s+', '', s, flags=re.IGNORECASE).strip()
            if s.lower() in stop_words or len(s) < 2:
                continue
            skills.append(s)

        print(f"  Final skills: {skills}")
        print()
    else:
        print("  No skill keywords found")
        print()

# Test cases
test_extract("Add Kubernetes and Terraform to my skills")
test_extract("Update my skills to include Python, Go, and Rust")
test_extract("Set my skills to Java and C++")
test_extract("Add Docker and Redis to my skills")
