# backend/main.py

from contextlib import asynccontextmanager

from fastapi import FastAPI
from backend.api import auth, sessions, user
from fastapi.middleware.cors import CORSMiddleware

from backend.core.config import settings
from backend.core.logger import get_logger



logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.db.database import engine

    logger.info("Starting up")
    yield
    logger.info("Shutting down")
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Multi-agent AI learning companion powered by LangGraph",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(user.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}