from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.agents.state import AgentState
from backend.core.config import get_settings
from backend.core.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

#llm setup

llm = ChatOpenAI(
    model = "gpt-4o",
    temperature=0.7,
    openai_api_key= settings.OPENAI_API_KEY
)


LEVEL_INSTRUCTIONS = {
    "beginner": (
        "Use simple language, avoid jargon. "
        "Use relatable analogies and real-world examples. "
        "Break things into small, numbered steps. "
        "Be encouraging and patient."
    ),
    "intermediate": (
        "Assume familiarity with basic concepts. "
        "Introduce proper terminology. "
        "Explain the 'why' behind concepts. "
        "Connect new ideas to things the student likely already knows."
    ),
    "advanced": (
        "Use precise technical language. "
        "Discuss edge cases, trade-offs, and nuances. "
        "Reference relevant theory or best practices. "
        "Challenge the student to think deeper."
    ),
}
 
