from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db.models import User
from backend.api.auth import router as auth_router
from backend.api.user import router as user_router
from backend.core.logger import get_logger
from backend.core.config import get_settings

settings = get_settings()



import backend.db.models

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: create DB tables if they don't exist
    # In production you'd use Alembic migrations instead.
    from backend.db.models import Base
    from backend.db.database import engine
    logger.info("Starting up — creating DB tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("DB tables ready")
    yield
    # SHUTDOWN: close the connection pool cleanly
    logger.info("Shutting down — disposing DB engine")
    await engine.dispose()




app = FastAPI(
    title = settings.APP_NAME,
    version = "1.0.0",
    description="Multi-agent AI learning companion powered by LangGraph",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)

@app.get("/")
def home():
    return {"message": "Hello, Learning Companion!"}