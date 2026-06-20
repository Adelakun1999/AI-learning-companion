from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name : str 
    email : EmailStr
    password : str
    learning_level : str = "beginner"


class UserLogin(BaseModel):
    email : EmailStr
    password : str


class UserResponse(BaseModel):
    id : str 
    name : str 
    email : str
    learning_level : str
    created_at : datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token : str 
    token_type : str = "bearer"
    user : UserResponse

class TopicProgressResponse(BaseModel):
    """Progress for a single topic"""
    topic: str
    mastery_score: float
    times_studied: int
    times_quizzed: int
    score_history: list[float]
    last_studied_at: datetime

    model_config = {"from_attributes": True}
