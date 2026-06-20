from datetime import datetime
from typing import List 

from fastapi import APIRouter , Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.agents.graph import run_graph
from backend.core.dependencies import get_current_user
from backend.db.database import get_db
from backend.db.models import StudySession, TopicProgress, User
from backend.schemas.session import (
    ChatRequest, ChatResponse, SessionCreate,
    SessionResponse , SessionSummary
)
from backend.schemas.user import TopicProgressResponse

router = APIRouter(tags=["sessions"])

#Start a session
@router.post("/session", response_model=SessionSummary, status_code= status.HTTP_201_CREATED)
async def create_session(
    body : SessionCreate,
    user : User = Depends(get_current_user),
    db : AsyncSession = Depends(get_db)
):
    """Start a new study session on a topic."""
    session = StudySession(user_id = user.id , topic = body.topic)
    db.add(session)
    await db.flush()
    return session

@router.get("/sessions", response_model=List[SessionSummary], status_code=status.HTTP_200_OK)
async def list_sessions(
    user : User = Depends(get_current_user),
    db : AsyncSession = Depends(get_db)
):
    """Get all study sessions for the current user"""
    result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == user.id)
        .order_by(StudySession.started_at.desc())
    )
    return result.scalars().all()

#Get session detail 
@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id : str ,
    user : User = Depends(get_current_user),
    db : AsyncSession = Depends(get_db)
):
    """Get a session with its full message history."""
    result = await db.execute(
        select(StudySession)
        .where(StudySession.id == session_id, StudySession.user_id == user.id)
        .options(selectinload(StudySession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code = status.HTTP_404, detail="Session not found")
    return session

#Chat 
@router.post("/session/{session_id}/chat", response_model=ChatResponse)
async def chat(
    session_id : str,
    body : ChatRequest,
    user : User = Depends(get_current_user),
    db : AsyncSession = Depends(get_db)
):
    """
    Send a message to the AI learning system.
    This is the core endpoint that invokes the LangGraph workflow.
    """
    #load the session
    result = await db.execute(
        select(StudySession)
        .where(StudySession.id == session_id, StudySession.user_id == user.id)
        .options(selectinload(StudySession.messages))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail = "Sessiom not found")
    if session.ended_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail = "Session has already ended")
    
    existing_messages = [
        {"role":msg.role, "content" : msg.content, "agent" : msg.agent}
        for msg in session.messages
    ]

    quiz_data = None 

    #run the graph 
    final_state = await run_graph(
        db = db ,
        user_id= user.id,
        session_id=session_id,
        topic=session.topic,
        learning_level=user.learning_level,
        user_message=body.message,
        message_type=body.message_type,
        existing_messages=existing_messages,
        quiz_data = quiz_data

    )

    return ChatResponse(
        message= final_state["response"],
        agent=final_state.get("next_agent", "tutor"),
        session_id=session_id,
        quiz_data=final_state.get("quiz_data")

    )

#  End session 
@router.post("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """End a session and generate a completion summary."""
    result = await db.execute(
        select(StudySession)
        .where(StudySession.id == session_id, StudySession.user_id == user.id)
        .options(selectinload(StudySession.messages))
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.utcnow()

    # Simple summary: count messages by agent
    agent_counts: dict[str, int] = {}
    for msg in session.messages:
        if msg.agent:
            agent_counts[msg.agent] = agent_counts.get(msg.agent, 0) + 1

    session.summary = (
        f"Session on '{session.topic}' completed. "
        f"Exchanged {len(session.messages)} messages. "
        + (f"Agents used: {', '.join(agent_counts.keys())}." if agent_counts else "")
    )

    await db.flush()
    return session


#  Progress 
@router.get("/progress", response_model=List[TopicProgressResponse])
async def get_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get mastery scores for all topics the student has studied."""
    result = await db.execute(
        select(TopicProgress)
        .where(TopicProgress.user_id == user.id)
        .order_by(TopicProgress.mastery_score.desc())
    )
    return result.scalars().all()






