"""Normalize profile list fields that may be strings or {name, level} dicts from LLM output."""

import json


def coerce_string_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                value = parsed
            else:
                return [s.strip() for s in value.split(",") if s.strip()]
        except (json.JSONDecodeError, TypeError):
            return [s.strip() for s in value.split(",") if s.strip()]
    if not isinstance(value, list):
        return []

    out: list[str] = []
    for item in value:
        if isinstance(item, str):
            s = item.strip()
            if s:
                out.append(s)
        elif isinstance(item, dict):
            name = item.get("name") or item.get("skill") or item.get("title") or ""
            extra = item.get("level") or item.get("description") or ""
            if name and extra:
                out.append(f"{name} ({extra})")
            elif name:
                out.append(str(name))
            elif extra:
                out.append(str(extra))
        elif item is not None:
            out.append(str(item))
    return out
