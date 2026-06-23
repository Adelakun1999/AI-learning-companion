from functools import lru_cache

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME : str = "AI Learning Companion"
    DEBUG: bool = False
    OPENAI_API_KEY: str
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
