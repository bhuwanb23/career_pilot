import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.workflow import StepResult, StepSpec, Workflow, WorkflowExecutor, ToolChain
from services.tool_registry import Tool


def _make_ws():
    ws = AsyncMock()
    ws.send_json = AsyncMock()
    return ws


def _make_db():
    return MagicMock()


class TestToolStepSpec:
    def test_tool_step_has_tool_name(self):
        step = StepSpec(name="s1", step_type="tool", tool_name="profile_get")
        assert step.tool_name == "profile_get"
        assert step.fn is None

    def test_param_refs_field(self):
        step = StepSpec(name="s1", step_type="tool", tool_name="test",
                        param_refs={"key": "other_step"})
        assert step.param_refs == {"key": "other_step"}

    def test_fn_step_still_works(self):
        step = StepSpec(name="s1", step_type="check", fn=AsyncMock)
        assert step.fn is not None
        assert step.tool_name is None


class TestWorkflowExecutorToolSteps:
    @pytest.mark.asyncio
    async def test_executes_tool_from_registry(self):
        from services.tool_registry import registry
        tool = registry.get("analytics_get")
        assert tool is not None

        wf = Workflow(name="test", steps=[
            StepSpec(name="analytics", step_type="tool", tool_name="analytics_get"),
        ])

        db = MagicMock()
        db.query.return_value.all.return_value = []

        from sqlalchemy import func
        with patch("services.tools._analytics_get_execute") as mock_exec:
            mock_exec.return_value = {"total_applications": 0, "avg_match_score": 0.0}
            executor = WorkflowExecutor(_make_ws(), db, "s1")
            # The tool is registered, but we need to mock the actual DB call
            # Let's test with a simpler approach

        executor = WorkflowExecutor(_make_ws(), db, "s1")
        result = await executor.execute(wf)
        # analytics_get will run with the mock db
        assert "analytics" in executor.context

    @pytest.mark.asyncio
    async def test_param_refs_resolve_from_context(self):
        from services.tool_registry import Tool, registry

        async def mock_execute(db=None, val=0, **kw):
            return {"doubled": val * 2}

        tool_name = "_test_double_tool"
        registry.register(Tool(
            name=tool_name, description="test", category="Test",
            input_schema={}, output_schema={}, execute=mock_execute,
        ))

        async def set_val(ctx, db, **kw):
            return StepResult(success=True, data=42)

        wf = Workflow(name="test", steps=[
            StepSpec(name="val", step_type="prepare", fn=set_val),
            StepSpec(name="result", step_type="tool", tool_name=tool_name,
                     param_refs={"val": "val"}),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "s1")
        await executor.execute(wf)
        assert executor.context["result"] == {"doubled": 84}

    @pytest.mark.asyncio
    async def test_tool_not_found_fails(self):
        wf = Workflow(name="test", steps=[
            StepSpec(name="missing", step_type="tool", tool_name="nonexistent_tool_xyz"),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "s1")
        result = await executor.execute(wf)
        assert result is None
        assert any(not r["success"] for r in executor.results)

    @pytest.mark.asyncio
    async def test_step_without_fn_or_tool_fails(self):
        step = StepSpec(name="bad", step_type="check")
        executor = WorkflowExecutor(_make_ws(), _make_db(), "s1")
        result = await executor._execute_step(step)
        assert not result.success
        assert "no fn or tool_name" in result.error

    @pytest.mark.asyncio
    async def test_mixed_fn_and_tool_steps(self):
        from services.tool_registry import Tool, registry

        async def mock_exec(db=None, **kw):
            return {"status": "ok"}

        tool_name = "_test_mixed_tool"
        registry.register(Tool(
            name=tool_name, description="test", category="Test",
            input_schema={}, output_schema={}, execute=mock_exec,
        ))

        async def fn_step(ctx, db, **kw):
            return StepResult(success=True, data="from_fn")

        wf = Workflow(name="test", steps=[
            StepSpec(name="fn_step", step_type="prepare", fn=fn_step),
            StepSpec(name="tool_step", step_type="tool", tool_name=tool_name),
        ])

        executor = WorkflowExecutor(_make_ws(), _make_db(), "s1")
        await executor.execute(wf)
        assert executor.context["fn_step"] == "from_fn"
        assert executor.context["tool_step"] == {"status": "ok"}


class TestToolChain:
    @pytest.mark.asyncio
    async def test_executes_sequence(self):
        from services.tool_registry import registry

        async def tool_a(**kw):
            return {"a": 1}

        async def tool_b(**kw):
            return {"b": 2}

        # Use unique names that won't collide
        tool_a_obj = Tool(name="_seq_a", description="", category="Test",
                          input_schema={}, output_schema={}, execute=tool_a)
        tool_b_obj = Tool(name="_seq_b", description="", category="Test",
                          input_schema={}, output_schema={}, execute=tool_b)
        registry.register(tool_a_obj)
        registry.register(tool_b_obj)

        chain = ToolChain([
            {"tool": "_seq_a", "params": {}},
            {"tool": "_seq_b", "params": {}},
        ])
        result = await chain.execute(MagicMock())
        assert result["_seq_a"] == {"a": 1}
        assert result["_seq_b"] == {"b": 2}

    @pytest.mark.asyncio
    async def test_refs_resolve_previous_output(self):
        from services.tool_registry import registry

        async def producer(**kw):
            return {"value": 10}

        async def consumer(**kw):
            data = kw.get("data")
            return {"doubled": data["value"] * 2}

        registry.register(Tool(name="_ref_prod", description="", category="Test",
                               input_schema={}, output_schema={}, execute=producer))
        registry.register(Tool(name="_ref_cons", description="", category="Test",
                               input_schema={}, output_schema={}, execute=consumer))

        chain = ToolChain([
            {"tool": "_ref_prod", "params": {}},
            {"tool": "_ref_cons", "params": {}, "refs": {"data": "_ref_prod"}},
        ])
        result = await chain.execute(MagicMock())
        assert result["_ref_cons"] == {"doubled": 20}

    @pytest.mark.asyncio
    async def test_handles_tool_failure(self):
        from services.tool_registry import registry

        async def failing_tool(**kw):
            raise ValueError("boom")

        registry.register(Tool(name="_fail_tool", description="", category="Test",
                               input_schema={}, output_schema={}, execute=failing_tool))

        chain = ToolChain([{"tool": "_fail_tool", "params": {}}])
        result = await chain.execute(MagicMock())
        assert "error" in result["_fail_tool"]

    @pytest.mark.asyncio
    async def test_handles_missing_tool(self):
        chain = ToolChain([{"tool": "nonexistent_xyz", "params": {}}])
        result = await chain.execute(MagicMock())
        assert "error" in result["nonexistent_xyz"]


class TestLLMClassification:
    @pytest.mark.asyncio
    async def test_returns_dict_with_intent_and_tool_plan(self):
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = '{"intent": "analyze_job", "confidence": 0.9, "tool_plan": [{"tool": "profile_get"}]}'
            result = await classify_intent_with_llm("analyze this job")
            assert result["intent"] == "analyze_job"
            assert result["tool_plan"] == [{"tool": "profile_get"}]

    @pytest.mark.asyncio
    async def test_returns_tool_plan_none_when_not_provided(self):
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = '{"intent": "show_profile", "confidence": 0.8}'
            result = await classify_intent_with_llm("show my profile")
            assert result["intent"] == "show_profile"
            assert result["tool_plan"] is None

    @pytest.mark.asyncio
    async def test_invalid_json_returns_general_chat(self):
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = "not json"
            result = await classify_intent_with_llm("something")
            assert result["intent"] == "general_chat"
            assert result["tool_plan"] is None

    @pytest.mark.asyncio
    async def test_llm_error_returns_general_chat(self):
        from routers.chat import classify_intent_with_llm
        with patch("routers.chat.generate", new_callable=AsyncMock) as mock_gen:
            mock_gen.side_effect = Exception("LLM down")
            result = await classify_intent_with_llm("hello")
            assert result["intent"] == "general_chat"
