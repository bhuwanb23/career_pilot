"""Verify page CRUD tools execute without error against test DB."""

import pytest

from services.tool_registry import registry


PAGE_TOOLS = [
    "application_list",
    "applications_list",
    "application_get",
    "application_timeline",
    "application_score",
    "outreach_dashboard",
    "outreach_due",
    "interview_dashboard",
    "persona_list",
    "memory_list",
    "pipeline_status",
    "pipeline_application",
    "profile_get",
    "analytics_get",
]


@pytest.mark.asyncio
@pytest.mark.parametrize("tool_name", PAGE_TOOLS)
async def test_read_tools_execute(db_session, tool_name):
    tool = registry.get(tool_name)
    assert tool is not None, f"Tool {tool_name} not registered"
    params = {}
    if tool_name in ("application_get", "application_timeline", "application_score", "pipeline_application"):
        params = {"application_id": 999}
    if tool_name == "persona_get":
        params = {"persona_id": 999}
    result = await tool.execute(db=db_session, **params)
    assert isinstance(result, dict)
    if "application_id" in params and params["application_id"] == 999:
        assert "error" in result or result.get("events") == []


@pytest.mark.asyncio
async def test_memory_store_and_list(db_session):
    store = registry.get("memory_store")
    lst = registry.get("memory_list")
    await store.execute(db=db_session, key="test_key", value="test_value", category="general")
    result = await lst.execute(db=db_session)
    assert "test_key" in result.get("memories", {})


@pytest.mark.asyncio
async def test_profile_update(db_session):
    tool = registry.get("profile_update")
    result = await tool.execute(db=db_session, updates={"summary": "Agent test summary"})
    assert result.get("summary") == "Agent test summary"
