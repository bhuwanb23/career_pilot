import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import Base, engine, migrate_schema
from logging_config import setup_logging
from routers import resume, profile, applications, interview, outreach, chat, tools, careerops, personas, memory, analytics
import services.tools  # noqa: F401 — registers all tools
from services.llm_client import health_check

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    llm_ok = await health_check()
    if llm_ok:
        logger.info("LLM provider (%s) is reachable", settings.LLM_PROVIDER)
    else:
        logger.warning("LLM provider (%s) is not reachable - AI features will fail", settings.LLM_PROVIDER)
    yield


app = FastAPI(title="CareerPilot AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(profile.router)
app.include_router(applications.router)
app.include_router(interview.router)
app.include_router(outreach.router)
app.include_router(chat.router)
app.include_router(tools.router)
app.include_router(careerops.router)
app.include_router(personas.router)
app.include_router(memory.router)
app.include_router(analytics.router)


@app.get("/api/health")
async def health():
    llm_ok = await health_check()
    return {"status": "ok", "provider": settings.LLM_PROVIDER, "llm": llm_ok}
