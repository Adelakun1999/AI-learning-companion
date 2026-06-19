from sqlalchemy.ext.asyncio import AsyncSession
from langgraph.graph import START,END,StateGraph

from backend.agents.state import AgentState
from backend.agents.orchestrator import orchestrator, route_to_agent
from backend.agents.tutor_agent import tutor_agent
from backend.agents.quiz_agent import quiz_agent
from backend.agents.feedback_agent import feedback_agent
from backend.agents.progress_tracker import make_progress_tracker
from backend.core.logger import get_logger

logger = get_logger(__name__)

def build_graph(db : AsyncSession):
    """
    Build and compile the LangGraph workflow.
    
    Called once per request (we pass the DB session in so progress_tracker
    can persist data within the same request's transaction).
    
    Returns a compiled graph ready to invoke with:
        result = await graph.ainvoke(initial_state)
    """
    #create the graph builder 
    builder = StateGraph(AgentState)

    #Register Nodes
    builder.add_node("orchestrator", orchestrator)
    builder.add_node("tutor", tutor_agent)
    builder.add_node("quiz", quiz_agent)
    builder.add_node("feedback", feedback_agent)

    #progress tracker needs DB acess 
    progress_tracker_node = make_progress_tracker(db)
    builder.add_node("progress_tracker", progress_tracker_node)


    #Define edges
    # START → orchestrator
    builder.add_edge(START, "orchestrator")

    builder.add_conditional_edges(
        source="orchestrator",     
        path=route_to_agent,       
        path_map={                  
            "tutor": "tutor",
            "quiz": "quiz",
            "feedback": "feedback",
        },
    )

    # All specialist agents → progress_tracker (unconditional)
    builder.add_edge("tutor", "progress_tracker")
    builder.add_edge("quiz", "progress_tracker")
    builder.add_edge("feedback", "progress_tracker")

    # progress_tracker → END: workflow is complete
    builder.add_edge("progress_tracker", END)

    # ── Compile ────────────────────────────────────────────────
    # compile() validates the graph and returns a runnable object.
    # After compile(), you can call .ainvoke() or .astream().
    graph = builder.compile()

    logger.info("LangGraph compiled successfully")
    return graph


async def run_graph(
    db: AsyncSession,
    user_id: str,
    session_id: str,
    topic: str,
    learning_level: str,
    user_message: str,
    message_type: str = "auto",
    existing_messages: list[dict] = None,
    quiz_data: dict = None,
    current_session_score: float = 0.0,
) -> dict:
    """
    Convenience function to build and run the graph for one turn.
    
    Called by the API layer — hides graph complexity from route handlers.
    
    Returns the final state dict after all nodes have run.
    """
    # Apply explicit routing prefix 
    # If the client specified message_type, prepend a routing hint.
    # The orchestrator reads this prefix and skips LLM routing.
    if message_type != "auto":
        prefixed_input = f"__ROUTE:{message_type}__{user_message}"
    else:
        prefixed_input = user_message

    # Build initial state
    # This is the state snapshot we hand to the graph at the start.
    # The graph will mutate and return a final state.
    initial_state: AgentState = {
        "user_id": user_id,
        "session_id": session_id,
        "topic": topic,
        "learning_level": learning_level,
        "messages": existing_messages or [],   # Conversation history
        "current_input": prefixed_input,
        "next_agent": "",                      # Set by orchestrator
        "response": "",                        # Set by specialist agent
        "quiz_data": quiz_data,                # Persisted across turns
        "current_session_score": current_session_score,
        "session_summary": None,
    }

    #  Build and run the graph 
    graph = build_graph(db)

    logger.info(f"Running graph | user={user_id} | session={session_id}")
    final_state = await graph.ainvoke(initial_state)
    logger.info(f"Graph complete | agent={final_state.get('next_agent')}")

    return final_state
