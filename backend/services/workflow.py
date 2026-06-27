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
    fn: Callable[..., Awaitable[StepResult]]
    params: dict = field(default_factory=dict)
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

    async def execute(self, workflow: Workflow) -> str | None:
        await self._send_progress(f"Starting {workflow.name}...")

        for step in workflow.steps:
            await self._send_progress(f"  → {step.name}...")
            start = time.monotonic()

            try:
                result = await step.fn(self.context, self.db, **step.params)
                elapsed = (time.monotonic() - start) * 1000
                self.results.append({
                    "step": step.name,
                    "type": step.step_type,
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
