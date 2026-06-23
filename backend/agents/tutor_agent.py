from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from backend.agents.state import AgentState
from backend.core.config import settings
from backend.core.logger import get_logger


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

async def tutor_agent(state : AgentState)-> dict:
    logger.info(f"Tutor agent activated | topic = {state['topic']} | level = {state['learning_level']}")
    level = state.get("learning_level", "beginner")
    level_instructions = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["beginner"])

    # The system prompt defines the agent's persona and constraints.
    system_prompt = f"""You are an expert, patient tutor helping a student learn about: {state['topic']}.

Student level: {level}
{level_instructions}

Guidelines:
- Keep explanations focused and concise (aim for 150-250 words unless depth is needed)
- Use markdown formatting: headers (##), bold (**text**), code blocks (```), bullet points
- End with one thought-provoking question to check understanding
- If the student seems confused, offer a different angle or analogy
"""
    # Build the messages list for the LLM 
    # We send the full conversation history so the LLM has context.
    # SystemMessage sets the assistant's behaviour.
    # HumanMessage is the student's current question.
    llm_messages = [SystemMessage(content = system_prompt)]

    # Include recent conversation history (last 10 messages = 5 turns)
    # This gives the LLM context without overloading the context window.
    history = state.get("messages", [])[-10:]
    for msg in history:
        if msg['role'] == "user":
            llm_messages.append(HumanMessage(content=msg['content']))

    #Add the current question 
    llm_messages.append(HumanMessage(content = state['current_input']))

    #call the llm 
    response = await llm.ainvoke(llm_messages)
    reply = response.content

    logger.info("Tutor agent completed response")

    #Return state update
    return {
        "messages" : [
            {"role" : "user", "content" : state['current_input']},
            {"role" : "assistant", "content" : reply, "agent" : "tutor_agent"},
        ],
        "response" : reply,
        "next_agent" : "progress_tracker"
    }

     

