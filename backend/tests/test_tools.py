import base64
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.tool_registry import Tool, ToolRegistry


class TestToolRegistry:
    def test_register_and_get(self):
        reg = ToolRegistry()
        tool = Tool(name="test_tool", description="A test", category="Test",
                     input_schema={}, output_schema={}, execute=AsyncMock())
        reg.register(tool)
        assert reg.get("test_tool") is tool

    def test_get_nonexistent_returns_none(self):
        reg = ToolRegistry()
        assert reg.get("nope") is None

    def test_list_all(self):
        reg = ToolRegistry()
        reg.register(Tool(name="a", description="A", category="X", input_schema={}, output_schema={}, execute=AsyncMock()))
        reg.register(Tool(name="b", description="B", category="Y", input_schema={}, output_schema={}, execute=AsyncMock()))
        result = reg.list_all()
        assert len(result) == 2

    def test_list_by_category(self):
        reg = ToolRegistry()
        reg.register(Tool(name="a", description="A", category="X", input_schema={}, output_schema={}, execute=AsyncMock()))
        reg.register(Tool(name="b", description="B", category="X", input_schema={}, output_schema={}, execute=AsyncMock()))
        reg.register(Tool(name="c", description="C", category="Y", input_schema={}, output_schema={}, execute=AsyncMock()))
        assert len(reg.list_by_category("X")) == 2

    def test_categories(self):
        reg = ToolRegistry()
        reg.register(Tool(name="a", description="A", category="X", input_schema={}, output_schema={}, execute=AsyncMock()))
        reg.register(Tool(name="b", description="B", category="Y", input_schema={}, output_schema={}, execute=AsyncMock()))
        assert reg.categories() == ["X", "Y"]

    def test_to_system_prompt(self):
        reg = ToolRegistry()
        reg.register(Tool(name="my_tool", description="Does something", category="MyCat",
                          input_schema={"type": "object"}, output_schema={}, execute=AsyncMock()))
        prompt = reg.to_system_prompt()
        assert "my_tool" in prompt
        assert "[MyCat]" in prompt


class TestGlobalRegistry:
    def test_registry_has_all_expected_tools(self):
        from services.tool_registry import registry
        expected = [
            "resume_parse", "resume_generate", "job_analyze",
            "cover_letter_generate", "recruiter_msg_generate",
            "profile_get", "applications_list",
            "document_extract", "interview_prep", "analytics_get",
        ]
        for name in expected:
            assert registry.get(name) is not None, f"Missing tool: {name}"

    def test_registry_has_categories(self):
        from services.tool_registry import registry
        cats = registry.categories()
        assert "Resume" in cats
        assert "JD" in cats
        assert "CareerOps" in cats
        assert "MinerU" in cats
        assert "Interview" in cats
        assert "Database" in cats

    def test_all_tools_have_schemas(self):
        from services.tool_registry import registry
        for tool_dict in registry.list_all():
            assert "input_schema" in tool_dict
            assert "output_schema" in tool_dict
            assert isinstance(tool_dict["input_schema"], dict)

    def test_system_prompt_contains_all_tools(self):
        from services.tool_registry import registry
        prompt = registry.to_system_prompt()
        for tool_dict in registry.list_all():
            assert tool_dict["name"] in prompt


class TestToolREST:
    def test_list_tools(self, client):
        r = client.get("/api/tools")
        assert r.status_code == 200
        tools = r.json()
        assert len(tools) >= 10
        assert any(t["name"] == "job_analyze" for t in tools)

    def test_list_categories(self, client):
        r = client.get("/api/tools/categories")
        assert r.status_code == 200
        cats = r.json()
        assert "Resume" in cats
        assert "JD" in cats

    def test_get_tool(self, client):
        r = client.get("/api/tools/job_analyze")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "job_analyze"
        assert data["category"] == "JD"

    def test_get_tool_404(self, client):
        r = client.get("/api/tools/nonexistent")
        assert r.status_code == 404

    def test_execute_tool_404(self, client):
        r = client.post("/api/tools/nonexistent/execute", json={"params": {}})
        assert r.status_code == 404


class TestDocumentExtractor:
    def _make_pdf(self, text="Hello World"):
        import fitz
        doc = fitz.open()
        page = doc.new_page()
        page.insert_text((72, 720), text)
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes

    def test_pymupdf_fallback(self):
        from services.document_extractor import _extract_with_pymupdf
        pdf_bytes = self._make_pdf("Test Content")
        result = _extract_with_pymupdf(pdf_bytes)
        assert "Test Content" in result["text"]
        assert result["engine"] == "pymupdf"
        assert result["pages"] == 1

    @pytest.mark.asyncio
    async def test_extract_document_falls_back_to_pymupdf(self):
        from services.document_extractor import extract_document
        pdf_bytes = self._make_pdf("Extracted Text")
        result = await extract_document(pdf_bytes)
        assert "Extracted Text" in result["text"]
        assert result["engine"] == "pymupdf"


class TestToolExecute:
    @pytest.mark.asyncio
    async def test_analytics_get(self):
        from services.tool_registry import registry
        from database import SessionLocal, Base, engine
        from models import Application

        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        db = SessionLocal()
        db.add(Application(company="Test", role="Dev", job_description="jd", match_score=0.8))
        db.commit()

        tool = registry.get("analytics_get")
        result = await tool.execute(db=db)
        assert result["total_applications"] == 1
        assert result["avg_match_score"] == 0.8
        db.close()

    @pytest.mark.asyncio
    async def test_profile_get_empty(self):
        from services.tool_registry import registry
        from database import SessionLocal, Base, engine

        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)

        db = SessionLocal()
        tool = registry.get("profile_get")
        result = await tool.execute(db=db)
        assert "error" in result
        db.close()
