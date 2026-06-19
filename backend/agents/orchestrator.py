from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage , SystemMessage
from backend.agents.state import AgentState
from backend.core.config import get_settings
from backend.core.logger import get_logger
settings = get_settings()

logger = get_logger(__name__)

llm = ChatOpenAI(
    model="gpt-4o-mini",    
    temperature=0,           # We want deterministic routing, not creative
    api_key= settings.OPENAI_API_KEY
)


async def orchestrator(state: AgentState) -> dict:
    """
    LangGraph node — determines which agent should handle the student's message.
    
    Sets state["next_agent"] to one of: "tutor", "quiz", "feedback"
    LangGraph then uses this value in conditional_edge routing.
    """
    logger.info(f"Orchestrator routing | input='{state['current_input'][:50]}...'")

    # Handle active quiz
    # If the student is in the middle of a quiz, their message is an answer.
    # Always route to quiz agent — don't let them accidentally exit the quiz.
    quiz_data = state.get("quiz_data", {})
    if quiz_data and quiz_data.get("awaiting_answer"):
        logger.info("Routing: active quiz detected → quiz_agent")
        return {"next_agent": "quiz"}

    # Explicit routing (from API request) 
    # The API layer can pass a hint from the frontend.
    # We embed this hint in the current_input as a prefix.
    user_input = state["current_input"]

    if user_input.startswith("__ROUTE:quiz__"):
        logger.info("Routing: explicit → quiz_agent")
        return {"next_agent": "quiz"}
    if user_input.startswith("__ROUTE:feedback__"):
        logger.info("Routing: explicit → feedback_agent")
        return {"next_agent": "feedback"}
    if user_input.startswith("__ROUTE:tutor__"):
        logger.info("Routing: explicit → tutor_agent")
        return {"next_agent": "tutor"}

    # Auto routing via LLM 
    system_prompt = """You are a router that categorises student messages.
    
Given a student's message, respond with exactly ONE word:
- "tutor"    → student wants an explanation, has a question, is confused
- "quiz"     → student wants to be tested, quizzed, or practice questions
- "feedback" → student wants to know how they're doing, progress, or motivation

Examples:
"Explain recursion to me" → tutor
"I don't understand decorators" → tutor
"Quiz me on this topic" → quiz
"Test my knowledge" → quiz
"How am I doing?" → feedback
"What are my weak areas?" → feedback
"Give me some practice questions" → quiz

Respond with exactly one word. Nothing else."""

    response = await llm.ainvoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_input),
    ])

    # Clean and validate the routing decision
    route = response.content.strip().lower()
    valid_routes = {"tutor", "quiz", "feedback"}

    if route not in valid_routes:
        logger.warning(f"LLM returned invalid route '{route}', defaulting to 'tutor'")
        route = "tutor"

    logger.info(f"Orchestrator decided: → {route}_agent")
    return {"next_agent": route}


def route_to_agent(state: AgentState) -> str:
    """
    LangGraph conditional edge function.
    
    LangGraph calls this after the orchestrator node runs.
    It reads state["next_agent"] and returns the name of the next node.
    
    This is the 'switch statement' of the graph.
    """
    return state.get("next_agent", "tutor")
