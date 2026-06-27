import json
import logging
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

logger = logging.getLogger(__name__)


@dataclass
class Tool:
    name: str
    description: str
    category: str
    input_schema: dict
    output_schema: dict
    execute: Callable[..., Awaitable[Any]]


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool
        logger.debug("Registered tool: %s (%s)", tool.name, tool.category)

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def list_all(self) -> list[dict]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "input_schema": t.input_schema,
                "output_schema": t.output_schema,
            }
            for t in self._tools.values()
        ]

    def list_by_category(self, category: str) -> list[dict]:
        return [t for t in self.list_all() if t["category"] == category]

    def categories(self) -> list[str]:
        return sorted(set(t.category for t in self._tools.values()))

    def to_system_prompt(self) -> str:
        lines = []
        for cat in self.categories():
            lines.append(f"\n[{cat}]")
            for t in self._tools.values():
                if t.category == cat:
                    lines.append(f"  - {t.name}: {t.description}")
                    inp = json.dumps(t.input_schema, indent=None)
                    if len(inp) > 120:
                        inp = inp[:120] + "..."
                    lines.append(f"    Input: {inp}")
        return "\n".join(lines)


registry = ToolRegistry()
