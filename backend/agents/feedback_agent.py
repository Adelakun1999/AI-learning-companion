from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from backend.agents.state import AgentState
from backend.core.config import get_settings
from backend.core.logger import get_logger

settings = get_settings()
logger = get_logger()


llm = ChatOpenAI(
    model = "gpt-4o",
    temperature=0.6,
    api_key= settings.OPENAI_API_KEY
)

async def feedback_agent(state: AgentState) -> dict:
    """
    LangGraph node — generates motivational, constructive feedback.
    """
    logger.info(f"Feedback agent activated | topic={state['topic']}")

    quiz_data = state.get("quiz_data")
    session_score = state.get("current_session_score", 0.0)
    message_count = len(state.get("messages", []))

    # Build a summary of what's happened this session
    context_parts = [f"Topic: {state['topic']}", f"Messages exchanged: {message_count}"]

    if quiz_data and "final_score" in quiz_data:
        context_parts.append(f"Quiz score: {int(quiz_data['final_score'] * 100)}%")
        if "scores" in quiz_data:
            context_parts.append(
                f"Per-question scores: {[int(s * 100) for s in quiz_data['scores']]}"
            )

    session_context = "\n".join(context_parts)

    system_prompt = f"""You are an encouraging, insightful learning coach.

Session data:
{session_context}

Student level: {state.get('learning_level', 'beginner')}
Student's message: {state['current_input']}

Provide personalised feedback that:
1. Acknowledges specific things the student did well this session
2. Identifies 1-2 concrete areas to focus on next
3. Suggests one practical next step (a resource, exercise, or topic to explore)
4. Ends with a genuine motivational message tailored to their performance

Keep it warm, specific, and actionable (150-200 words).
Use markdown formatting with clear sections.
"""

    response = await llm.ainvoke([SystemMessage(content=system_prompt)])
    reply = response.content

    logger.info("Feedback agent completed")

    return {
        "messages": [
            {"role": "user", "content": state["current_input"]},
            {"role": "assistant", "content": reply, "agent": "feedback_agent"},
        ],
        "response": reply,
        "next_agent": "progress_tracker",
    }


