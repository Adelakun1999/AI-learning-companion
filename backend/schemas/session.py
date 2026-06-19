from datetime import datetime
from pydantic import BaseModel
from typing import Optional

#Request schemas
class SessionCreate(BaseModel):
    topic : str 


class ChatRequest(BaseModel):
    """
    The main payload for every student message.
    
    message_type tells the orchestrator what kind of help the student wants:
    - "explain"  → route to Tutor Agent
    - "quiz"     → route to Quiz Agent  
    - "feedback" → route to Feedback Agent
    - "auto"     → let the Orchestrator decide (default)
    """
    message: str
    message_type: str = "auto"


#Response schemas
class MessageResponse(BaseModel):
    id : str 
    role : str 
    content : str 
    agent : Optional[str]
    created_at : datetime

    model_config = {"from_attributes" : True}

class ChatResponse(BaseModel):
    """
    Response from the agent system.
    Includes the agent reply plus any quiz data if applicable.
    """
    message: str            # The agent's reply text
    agent: str              # Which agent responded
    session_id: str
    # quiz_data is populated when quiz agent generates questions
    quiz_data: Optional[dict] = None


class SessionResponse(BaseModel):
    """Full session data"""
    id: str
    topic: str
    started_at: datetime
    ended_at: Optional[datetime]
    summary: Optional[str]
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    """Lightweight session info for listing sessions"""
    id: str
    topic: str
    started_at: datetime
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}

