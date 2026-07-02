"""ReAct-style agent loop: LLM picks tools, executes via registry, returns UI actions."""

import json
import logging
from dataclasses import dataclass, field

from sqlalchemy.orm import Session

from services.agent_prompt import build_agent_system_prompt
from services.llm_client import generate, health_check
from services.llm_utils import parse_llm_json
from services.tool_registry import registry
from services.workflow import ToolChain

logger = logging.getLogger(__name__)

MAX_STEPS = 8
REPAIR_PROMPT = "Your last response was not valid JSON. Return ONLY valid JSON matching the schema."


@dataclass
class AgentTurnResult:
    response: str
    ui_actions: list[dict] = field(default_factory=list)
    tool_trace: list[dict] = field(default_factory=list)
    intent: str = "agent"
    action_type: str | None = None
    action_data: dict | None = None


def _truncate_result(data: object, limit: int = 2000) -> object:
    text = json.dumps(data, default=str)
    if len(text) <= limit:
        return data
    return {"_truncated": True, "preview": text[:limit]}


async def _execute_tool(db: Session, tool_name: str, params: dict) -> dict:
    tool = registry.get(tool_name)
    if not tool:
        return {"error": f"Tool '{tool_name}' not found"}
    try:
        result = await tool.execute(db=db, **params)
        return result if isinstance(result, dict) else {"result": result}
    except Exception as e:
        logger.exception("Tool %s failed", tool_name)
        return {"error": str(e)}


def _parse_agent_response(raw: str) -> dict | None:
    parsed = parse_llm_json(raw, {})
    if not parsed or "type" not in parsed:
        return None
    return parsed


def _ui_action_to_legacy(action: dict) -> tuple[str | None, dict | None]:
    act = action.get("action")
    if act == "open_application":
        return "application_created", {"application_id": action.get("application_id")}
    if act == "show_upload":
        return "show_upload", {}
    if act == "navigate" and action.get("path") == "/":
        return "show_analytics", {}
    if act == "navigate" and action.get("path") == "/applications":
        return "show_applications", {}
    if act == "navigate" and action.get("path") == "/profile":
        return "show_profile", {}
    return None, None


async def _llm_step(messages: list[dict]) -> str:
    prompt_parts = []
    for m in messages:
        role = m["role"].upper()
        prompt_parts.append(f"{role}: {m['content']}")
    prompt = "\n\n".join(prompt_parts)
    return await generate(prompt, system=build_agent_system_prompt())


async def run_agent_turn(
    db: Session,
    user_msg: str,
    history: list[dict],
    domain_context: str = "",
) -> AgentTurnResult | None:
    """Run agent loop. Returns None if LLM unavailable (caller should fallback)."""
    if not await health_check():
        return None

    messages: list[dict] = []
    if domain_context:
        messages.append({"role": "system", "content": domain_context})
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_msg})

    tool_trace: list[dict] = []
    step_results: list[dict] = []

    for step in range(MAX_STEPS):
        raw = await _llm_step(messages)
        parsed = _parse_agent_response(raw)

        if not parsed:
            raw = await _llm_step(messages + [{"role": "assistant", "content": raw}, {"role": "user", "content": REPAIR_PROMPT}])
            parsed = _parse_agent_response(raw)

        if not parsed:
            logger.warning("Agent loop: unparseable LLM response at step %d", step)
            break

        msg_type = parsed.get("type")

        if msg_type == "final":
            ui_actions = parsed.get("ui_actions") or []
            action_type, action_data = None, None
            for ua in ui_actions:
                at, ad = _ui_action_to_legacy(ua)
                if at:
                    action_type, action_data = at, ad
                    break
            return AgentTurnResult(
                response=parsed.get("message", ""),
                ui_actions=ui_actions,
                tool_trace=tool_trace,
                action_type=action_type,
                action_data=action_data,
            )

        if msg_type == "tool_plan":
            steps = parsed.get("steps") or []
            chain_result = await ToolChain(steps).execute(db)
            for i, s in enumerate(steps):
                tname = s.get("tool", "")
                entry = chain_result.get(tname, {})
                tool_trace.append({
                    "tool": tname,
                    "status": "error" if isinstance(entry, dict) and entry.get("error") else "complete",
                    "result_preview": str(_truncate_result(entry))[:200],
                })
            step_results.append({"tool_plan": chain_result})
            messages.append({"role": "assistant", "content": raw})
            messages.append({"role": "user", "content": f"Tool plan results:\n{json.dumps(_truncate_result(chain_result), default=str)}"})
            continue

        if msg_type == "tool_call":
            tool_name = parsed.get("tool", "")
            params = parsed.get("params") or {}
            if tool_name == "profile_get" or "profile_data" not in params:
                needs_profile = tool_name in {
                    "job_analyze", "application_create", "resume_match", "career_pilot_score",
                    "cover_letter_generate", "recruiter_msg_generate", "interview_prep",
                    "interview_prepare", "resume_generate", "persona_generate",
                }
                if needs_profile and "profile_data" not in params:
                    prof = await _execute_tool(db, "profile_get", {})
                    if not prof.get("error"):
                        params["profile_data"] = prof

            result = await _execute_tool(db, tool_name, params)
            status = "error" if result.get("error") else "complete"
            tool_trace.append({
                "tool": tool_name,
                "status": status,
                "params_keys": list(params.keys()),
                "result_preview": str(_truncate_result(result))[:200],
            })
            step_results.append({tool_name: result})
            messages.append({"role": "assistant", "content": raw})
            messages.append({"role": "user", "content": f"Tool '{tool_name}' result:\n{json.dumps(_truncate_result(result), default=str)}"})
            continue

        break

    if step_results:
        summary = json.dumps(_truncate_result(step_results[-1]), default=str)[:500]
        return AgentTurnResult(
            response=f"I completed the requested actions. Latest result: {summary}",
            tool_trace=tool_trace,
        )

    return None
