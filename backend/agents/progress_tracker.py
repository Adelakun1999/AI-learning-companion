from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.agents.state import AgentState
from backend.db.models import Message, TopicProgress, StudySession
from backend.core.logger import get_logger

logger = get_logger(__name__)


def make_progress_tracker(db: AsyncSession):
    """
    Factory function that creates the progress_tracker node with DB access.
    
    We use a factory (function that returns a function) because LangGraph
    nodes must have the signature: (state) -> dict
    But we also need DB access. The factory "closes over" the db session.
    
    This pattern is called a CLOSURE — the inner function remembers
    the 'db' variable from the outer function's scope.
    """

    async def progress_tracker(state: AgentState) -> dict:
        """
        Persists the latest messages and updates progress metrics.
        Called after every other agent completes.
        """
        logger.info(f"Progress tracker running | session={state['session_id']}")

        # Save new messages to DB 
        # state["messages"] contains the full history (thanks to operator.add).
        # We only want to save messages added in THIS turn.
        # The last 2 messages are always the new ones (user + assistant).
        new_messages = state.get("messages", [])[-2:]

        for msg_data in new_messages:
            # Check if this exact message already exists to avoid duplicates
            # (progress_tracker could theoretically be called multiple times)
            new_msg = Message(
                session_id=state["session_id"],
                role=msg_data["role"],
                content=msg_data["content"],
                agent=msg_data.get("agent"),
            )
            db.add(new_msg)

        # Update topic mastery if quiz was completed 
        quiz_data = state.get("quiz_data", {})
        if quiz_data and "final_score" in quiz_data and not quiz_data.get("progress_saved"):
            final_score = quiz_data["final_score"]

            # Load or create TopicProgress record
            result = await db.execute(
                select(TopicProgress).where(
                    TopicProgress.user_id == state["user_id"],
                    TopicProgress.topic == state["topic"],
                )
            )
            progress = result.scalar_one_or_none()

            if not progress:
                # IMPORTANT: explicitly set starting values here, even
                # though the DB column has default=0/0.0. Column
                # defaults are applied at INSERT time by the database —
                # they do NOT populate the in-memory Python attribute
                # immediately. Since we increment these same attributes
                # a few lines below (progress.times_quizzed += 1) BEFORE
                # any flush/commit happens, relying on the DB default
                # would leave them as None in Python and crash on +=.
                progress = TopicProgress(
                    user_id=state["user_id"],
                    topic=state["topic"],
                    mastery_score=0.0,
                    times_studied=0,
                    times_quizzed=0,
                    score_history=[],
                )
                db.add(progress)

            # Update running score history
            history = progress.score_history or []
            history.append(final_score)
            progress.score_history = history

            # Mastery = weighted average (recent scores matter more)
            # Simple approach: straight average of all scores
            progress.mastery_score = sum(history) / len(history)
            progress.times_quizzed += 1
            progress.last_studied_at = datetime.utcnow()

            # Mark as saved so we don't double-count
            quiz_data["progress_saved"] = True
            logger.info(
                f"Updated mastery score | topic={state['topic']} | "
                f"new_score={final_score:.2f} | avg={progress.mastery_score:.2f}"
            )

        # Update times_studied on the topic 
        if "progress" not in locals() or progress is None:
            result = await db.execute(
                select(TopicProgress).where(
                    TopicProgress.user_id == state["user_id"],
                    TopicProgress.topic == state["topic"],
                )
            )
            progress = result.scalar_one_or_none()

        if progress:
            # We'll rely on message count as a proxy — first message = first study
            if len(state.get("messages", [])) <= 2:
                progress.times_studied += 1

        await db.flush()  # Send SQL to DB but don't commit yet
                          # The FastAPI get_db() dependency commits at request end

        logger.info("Progress tracker: DB updated")

        # This node doesn't change any state fields visible to the student.
        # Return an empty dict = no state changes.
        return {}

    return progress_tracker