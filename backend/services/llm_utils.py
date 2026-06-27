import json


def strip_markdown_fences(text: str) -> str:
    text = text.strip()
    fence_end = text.rfind("```")
    if fence_end != -1:
        text = text[:fence_end]
    fence_start = text.find("```")
    if fence_start != -1:
        after_open = text[fence_start:]
        if "\n" in after_open:
            text = after_open.split("\n", 1)[1]
    return text.strip()


def parse_llm_json(response: str, fallback: dict) -> dict:
    cleaned = strip_markdown_fences(response)
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, TypeError):
        return fallback
