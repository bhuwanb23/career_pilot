import logging
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

logger = logging.getLogger(__name__)


@dataclass
class StepResult:
    success: bool
    data: Any = None
    error: str | None = None


@dataclass
class StepSpec:
    name: str
    step_type: str
    fn: Callable[..., Awaitable[StepResult]] | None = None
    tool_name: str | None = None
    params: dict = field(default_factory=dict)
    param_refs: dict = field(default_factory=dict)
    optional: bool = False


@dataclass
class Workflow:
    name: str
    steps: list[StepSpec]


class WorkflowExecutor:
    def __init__(self, websocket, db, session_id):
        self.ws = websocket
        self.db = db
        self.session_id = session_id
        self.context: dict[str, Any] = {}
        self.results: list[dict] = []

    def _resolve_params(self, step: StepSpec) -> dict:
        params = dict(step.params)
        for key, ref in step.param_refs.items():
            if ref in self.context:
                params[key] = self.context[ref]
        return params

    async def _execute_step(self, step: StepSpec) -> StepResult:
        if step.tool_name:
            from services.tool_registry import registry
            tool = registry.get(step.tool_name)
            if not tool:
                return StepResult(success=False, error=f"Tool '{step.tool_name}' not found in registry")
            resolved = self._resolve_params(step)
            logger.debug("Tool invocation: %s(%s)", step.tool_name, list(resolved.keys()))
            data = await tool.execute(db=self.db, **resolved)
            return StepResult(success=True, data=data)
        elif step.fn:
            resolved = self._resolve_params(step)
            return await step.fn(self.context, self.db, **resolved)
        else:
            return StepResult(success=False, error=f"Step '{step.name}' has no fn or tool_name")

    async def execute(self, workflow: Workflow) -> str | None:
        await self._send_progress(f"Starting {workflow.name}...")

        for step in workflow.steps:
            await self._send_progress(f"  → {step.name}...")
            start = time.monotonic()

            try:
                result = await self._execute_step(step)
                elapsed = (time.monotonic() - start) * 1000
                self.results.append({
                    "step": step.name,
                    "type": step.step_type,
                    "tool": step.tool_name,
                    "success": result.success,
                    "elapsed_ms": round(elapsed, 1),
                })

                if not result.success and not step.optional:
                    await self._send_error(f"Failed at '{step.name}': {result.error}")
                    return None

                if result.data is not None:
                    self.context[step.name] = result.data

            except Exception:
                elapsed = (time.monotonic() - start) * 1000
                logger.exception("Workflow step '%s' raised an exception", step.name)
                self.results.append({
                    "step": step.name,
                    "type": step.step_type,
                    "tool": step.tool_name,
                    "success": False,
                    "elapsed_ms": round(elapsed, 1),
                })
                await self._send_error(f"Error at '{step.name}'. Please try again.")
                return None

        return self.context.get("response_text")

    async def _send_progress(self, message: str):
        await self.ws.send_json({"type": "assistant_text", "content": message})

    async def _send_error(self, message: str):
        await self.ws.send_json({"type": "error", "content": message})


class ToolChain:
    def __init__(self, steps: list[dict]):
        self.steps = steps

    async def execute(self, db) -> dict:
        from services.tool_registry import registry
        context: dict[str, Any] = {}

        for i, step in enumerate(self.steps):
            tool_name = step.get("tool", "")
            tool = registry.get(tool_name)
            if not tool:
                logger.error("ToolChain step %d: tool '%s' not found", i, tool_name)
                context[tool_name] = {"error": f"Tool '{tool_name}' not found"}
                continue

            params = dict(step.get("params", {}))
            refs = step.get("refs", {})
            for key, ref in refs.items():
                if ref in context:
                    params[key] = context[ref]

            try:
                logger.info("ToolChain step %d: calling %s", i, tool_name)
                result = await tool.execute(db=db, **params)
                context[tool_name] = result
            except Exception:
                logger.exception("ToolChain step %d: tool '%s' failed", i, tool_name)
                context[tool_name] = {"error": f"Tool '{tool_name}' failed"}

        return context
