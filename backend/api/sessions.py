from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.agents.graph import run_graph
from backend.core.dependencies import get_current_user
from backend.db.database import get_db
from backend.db.models import StudySession, TopicProgress, User
from backend.schemas.session import (
    ChatRequest, ChatResponse, SessionCreate,
    SessionResponse, SessionSummary,
)
from backend.schemas.user import TopicProgressResponse

router = APIRouter(tags=["sessions"])


# Start a session 
@router.post("/sessions", response_model=SessionSummary, status_code=201)
async def create_session(
    body: SessionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new study session on a topic."""
    session = StudySession(user_id=user.id, topic=body.topic)
    db.add(session)
    await db.flush()
    return session


# List sessions 
@router.get("/sessions", response_model=List[SessionSummary])
async def list_sessions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all study sessions for the current user."""
    result = await db.execute(
        select(StudySession)
        .where(StudySession.user_id == user.id)
        .order_by(StudySession.started_at.desc())
    )
    return result.scalars().all()


# Get session detail 
@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a session with its full message history."""
    result = await db.execute(
        select(StudySession)
        .where(StudySession.id == session_id, StudySession.user_id == user.id)
        .options(selectinload(StudySession.messages))  # Eager-load messages
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# Chat 
@router.post("/sessions/{session_id}/chat", response_model=ChatResponse)
async def chat(
    session_id: str,
    body: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to the AI learning system.
    This is the core endpoint that invokes the LangGraph workflow.
    """
    # Load the session 
    result = await db.execute(
        select(StudySession)
        .where(StudySession.id == session_id, StudySession.user_id == user.id)
        .options(selectinload(StudySession.messages))
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at:
        raise HTTPException(status_code=400, detail="Session has already ended")

    # Reconstruct conversation history for the graph 
    # Convert ORM Message objects → simple dicts the LLM understands
    existing_messages = [
        {"role": msg.role, "content": msg.content, "agent": msg.agent}
        for msg in session.messages
    ]

    #  Load the active quiz state (if any) from the DB 
    # This is the fix: quiz_data must survive between HTTP requests,
    # since each chat message is a brand new request/response cycle.
    # We persist it on the StudySession row itself.
    quiz_data = session.quiz_state  # None if no quiz is active

    # Run the graph 
    final_state = await run_graph(
        db=db,
        user_id=user.id,
        session_id=session_id,
        topic=session.topic,
        learning_level=user.learning_level,
        user_message=body.message,
        message_type=body.message_type,
        existing_messages=existing_messages,
        quiz_data=quiz_data,
    )

    #  Persist the (possibly updated) quiz state back to the DB ──
    # This is the other half of the fix: whatever quiz_data looks
    # like after this turn (a fresh quiz, mid-quiz, or finished/None)
    # must be saved so the NEXT request sees it correctly.
    #
    # IMPORTANT: final_state["quiz_data"] may be the SAME dict object
    # that session.quiz_state already pointed to (it was mutated
    # in-place inside quiz_agent.py, not replaced). SQLAlchemy's
    # change-tracking for JSON columns can miss in-place mutations
    # on an object it already considers "the current value" — so we
    # explicitly build a brand-new dict (via deepcopy) to guarantee
    # SQLAlchemy sees this as a genuinely different value and emits
    # an UPDATE statement.
    import copy
    new_quiz_data = final_state.get("quiz_data")
    session.quiz_state = copy.deepcopy(new_quiz_data) if new_quiz_data is not None else None
    await db.flush()

    return ChatResponse(
        message=final_state["response"],
        agent=final_state.get("next_agent", "tutor"),
        session_id=session_id,
        quiz_data=final_state.get("quiz_data"),
    )


# End session 
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


# Progress 
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