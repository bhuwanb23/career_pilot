"""Tests for the ReAct agent loop."""

import json
from unittest.mock import AsyncMock, patch

import pytest

from services.agent_loop import run_agent_turn, _parse_agent_response, _execute_tool
from services.tool_registry import registry


@pytest.fixture
def mock_health():
    with patch("services.agent_loop.health_check", AsyncMock(return_value=True)):
        yield


class TestParseAgentResponse:
    def test_parses_tool_call(self):
        raw = '{"type":"tool_call","tool":"profile_get","params":{}}'
        assert _parse_agent_response(raw)["type"] == "tool_call"

    def test_parses_final(self):
        raw = '{"type":"final","message":"Done","ui_actions":[]}'
        parsed = _parse_agent_response(raw)
        assert parsed["type"] == "final"
        assert parsed["message"] == "Done"

    def test_strips_markdown_fences(self):
        raw = '```json\n{"type":"final","message":"Hi","ui_actions":[]}\n```'
        assert _parse_agent_response(raw)["message"] == "Hi"


class TestAgentLoop:
    @pytest.mark.asyncio
    async def test_final_response(self, db_session, mock_health):
        llm_responses = [
            '{"type":"final","message":"Hello!","ui_actions":[{"action":"navigate","path":"/profile"}]}',
        ]
        with patch("services.agent_loop.generate", AsyncMock(side_effect=llm_responses)):
            result = await run_agent_turn(db_session, "show profile", [], "")
        assert result is not None
        assert result.response == "Hello!"
        assert result.ui_actions[0]["path"] == "/profile"

    @pytest.mark.asyncio
    async def test_tool_call_then_final(self, db_session, mock_health):
        llm_responses = [
            '{"type":"tool_call","tool":"applications_list","params":{}}',
            '{"type":"final","message":"You have 0 apps","ui_actions":[{"action":"navigate","path":"/kanban"}]}',
        ]
        with patch("services.agent_loop.generate", AsyncMock(side_effect=llm_responses)):
            result = await run_agent_turn(db_session, "list apps", [], "")
        assert result is not None
        assert len(result.tool_trace) == 1
        assert result.tool_trace[0]["tool"] == "applications_list"
        assert result.tool_trace[0]["status"] == "complete"

    @pytest.mark.asyncio
    async def test_returns_none_when_llm_offline(self, db_session):
        with patch("services.agent_loop.health_check", AsyncMock(return_value=False)):
            result = await run_agent_turn(db_session, "hello", [], "")
        assert result is None

    @pytest.mark.asyncio
    async def test_max_steps_guard(self, db_session, mock_health):
        infinite_tool = '{"type":"tool_call","tool":"applications_list","params":{}}'
        with patch("services.agent_loop.generate", AsyncMock(return_value=infinite_tool)):
            result = await run_agent_turn(db_session, "loop", [], "")
        assert result is not None
        assert len(result.tool_trace) <= 8


class TestExecuteTool:
    @pytest.mark.asyncio
    async def test_unknown_tool(self, db_session):
        result = await _execute_tool(db_session, "nonexistent_tool_xyz", {})
        assert "error" in result

    @pytest.mark.asyncio
    async def test_applications_list_empty(self, db_session):
        result = await _execute_tool(db_session, "applications_list", {})
        assert result["total"] == 0
