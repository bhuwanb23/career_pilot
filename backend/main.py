from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import resume, profile, applications, interview, chat
from services.llm_client import health_check


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ollama_ok = await health_check()
    if ollama_ok:
        print("[OK] Ollama is running")
    else:
        print("[WARN] Ollama is not reachable - AI features will fail")
    yield


app = FastAPI(title="CareerPilot AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(profile.router)
app.include_router(applications.router)
app.include_router(interview.router)
app.include_router(chat.router)


@app.get("/api/health")
async def health():
    ollama_ok = await health_check()
    return {"status": "ok", "ollama": ollama_ok}
