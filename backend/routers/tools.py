import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from services.tool_registry import registry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tools", tags=["tools"])


class ToolExecuteRequest(BaseModel):
    params: dict = {}


@router.get("")
def list_tools():
    return registry.list_all()


@router.get("/categories")
def list_categories():
    categories = {}
    for cat in registry.categories():
        categories[cat] = registry.list_by_category(cat)
    return categories


@router.get("/{tool_name}")
def get_tool(tool_name: str):
    tool = registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")
    return {
        "name": tool.name,
        "description": tool.description,
        "category": tool.category,
        "input_schema": tool.input_schema,
        "output_schema": tool.output_schema,
    }


@router.post("/{tool_name}/execute")
async def execute_tool(tool_name: str, body: ToolExecuteRequest, db: Session = Depends(get_db)):
    tool = registry.get(tool_name)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

    try:
        result = await tool.execute(db=db, **body.params)
        return result
    except Exception as e:
        logger.exception("Tool '%s' execution failed", tool_name)
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")
