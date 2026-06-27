from unittest.mock import AsyncMock, MagicMock

import pytest

from services.workflow import StepResult, StepSpec, Workflow, WorkflowExecutor


def _make_ws():
    ws = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


def _make_db():
    return MagicMock()


class TestStepResult:
    def test_success(self):
        r = StepResult(success=True, data="hello")
        assert r.success is True
        assert r.data == "hello"
        assert r.error is None

    def test_failure(self):
        r = StepResult(success=False, error="boom")
        assert r.success is False
        assert r.error == "boom"


class TestWorkflowExecutor:
    @pytest.mark.asyncio
    async def test_executes_steps_sequentially(self):
        call_order = []

        async def step1(ctx, db, **kw):
            call_order.append(1)
            return StepResult(success=True, data="a")

        async def step2(ctx, db, **kw):
            call_order.append(2)
            return StepResult(success=True, data="b")

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="check", fn=step1),
            StepSpec(name="s2", step_type="check", fn=step2),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        await executor.execute(wf)
        assert call_order == [1, 2]

    @pytest.mark.asyncio
    async def test_shared_context(self):
        async def step1(ctx, db, **kw):
            return StepResult(success=True, data="hello")

        async def step2(ctx, db, **kw):
            return StepResult(success=True, data=ctx["s1"].upper())

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="prepare", fn=step1),
            StepSpec(name="s2", step_type="prepare", fn=step2),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        result = await executor.execute(wf)
        assert executor.context["s2"] == "HELLO"

    @pytest.mark.asyncio
    async def test_stops_on_failure(self):
        call_order = []

        async def step1(ctx, db, **kw):
            call_order.append(1)
            return StepResult(success=False, error="fail")

        async def step2(ctx, db, **kw):
            call_order.append(2)
            return StepResult(success=True)

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="check", fn=step1),
            StepSpec(name="s2", step_type="check", fn=step2),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        result = await executor.execute(wf)
        assert call_order == [1]
        assert result is None

    @pytest.mark.asyncio
    async def test_optional_step_continues_on_failure(self):
        async def step1(ctx, db, **kw):
            return StepResult(success=False, error="optional fail")

        async def step2(ctx, db, **kw):
            return StepResult(success=True, data="ok")

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="check", fn=step1, optional=True),
            StepSpec(name="s2", step_type="check", fn=step2),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        result = await executor.execute(wf)
        assert executor.context.get("s2") == "ok"

    @pytest.mark.asyncio
    async def test_exception_stops_execution(self):
        async def step1(ctx, db, **kw):
            raise ValueError("oops")

        async def step2(ctx, db, **kw):
            return StepResult(success=True)

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="check", fn=step1),
            StepSpec(name="s2", step_type="check", fn=step2),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        result = await executor.execute(wf)
        assert result is None

    @pytest.mark.asyncio
    async def test_sends_progress_messages(self):
        async def step1(ctx, db, **kw):
            return StepResult(success=True)

        wf = Workflow(name="my_workflow", steps=[
            StepSpec(name="s1", step_type="check", fn=step1),
        ])

        ws = _make_ws()
        executor = WorkflowExecutor(ws, _make_db(), "session-1")
        await executor.execute(wf)

        calls = ws.send_json.call_args_list
        contents = [c[0][0]["content"] for c in calls]
        assert any("Starting my_workflow" in c for c in contents)
        assert any("s1" in c for c in contents)

    @pytest.mark.asyncio
    async def test_returns_response_text(self):
        async def step1(ctx, db, **kw):
            return StepResult(success=True, data="final answer")

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="respond", fn=step1),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        result = await executor.execute(wf)
        assert executor.context.get("s1") == "final answer"

    @pytest.mark.asyncio
    async def test_passes_params(self):
        async def step1(ctx, db, **kw):
            return StepResult(success=True, data=kw.get("custom_param"))

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="prepare", fn=step1, params={"custom_param": 42}),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        await executor.execute(wf)
        assert executor.context["s1"] == 42

    @pytest.mark.asyncio
    async def test_records_step_results(self):
        async def step1(ctx, db, **kw):
            return StepResult(success=True)

        wf = Workflow(name="test", steps=[
            StepSpec(name="s1", step_type="check", fn=step1),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "session-1")
        await executor.execute(wf)
        assert len(executor.results) == 1
        assert executor.results[0]["step"] == "s1"
        assert executor.results[0]["success"] is True
        assert "elapsed_ms" in executor.results[0]


class TestWorkflowRegistry:
    def test_get_workflow_returns_workflow_for_each_intent(self):
        from services.workflows import get_workflow
        ws = _make_ws()
        for intent in ["upload_resume", "generate_resume", "generate_cover_letter",
                        "generate_recruiter_msg", "analyze_job", "prepare_interview",
                        "show_applications", "show_profile", "placement_analytics"]:
            wf = get_workflow(intent, "test message", ws)
            assert wf is not None, f"No workflow for intent: {intent}"
            assert wf.name, f"Workflow for {intent} has no name"
            assert len(wf.steps) > 0, f"Workflow for {intent} has no steps"

    def test_get_workflow_returns_none_for_general_chat(self):
        from services.workflows import get_workflow
        wf = get_workflow("general_chat", "hello", _make_ws())
        assert wf is None

    def test_analyze_job_workflow_has_expected_steps(self):
        from services.workflows import get_workflow
        wf = get_workflow("analyze_job", "analyze this job", _make_ws())
        step_names = [s.name for s in wf.steps]
        assert "check_profile" in step_names
        assert "prepare_data" in step_names
        assert "llm_analyze" in step_names
        assert "save_application" in step_names
        assert "respond" in step_names
