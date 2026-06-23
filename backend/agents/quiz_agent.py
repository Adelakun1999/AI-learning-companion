import json
import re

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from backend.agents.state import AgentState
from backend.core.config import settings
from backend.core.logger import get_logger

logger = get_logger(__name__)

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,   # Lower temp = more consistent, structured output
    api_key=settings.OPENAI_API_KEY,
)


async def quiz_agent(state: AgentState) -> dict:
    """
    LangGraph node — either generates a quiz or evaluates an answer.
    """
    #  Decide the mode 
    # If there's already an active quiz in state, the student is answering.
    # Otherwise, generate a new quiz.
    if state.get("quiz_data") and state["quiz_data"].get("awaiting_answer"):
        return await _evaluate_answer(state)
    else:
        return await _generate_quiz(state)


async def _generate_quiz(state: AgentState) -> dict:
    """
    Generate 3 quiz questions for the current topic.
    We ask the LLM to respond in JSON so we can parse it reliably.
    """
    logger.info(f"Generating quiz | topic={state['topic']}")

    level = state.get("learning_level", "beginner")

    system_prompt = f"""You are a quiz generator. Create exactly 3 quiz questions about: {state['topic']}
Level: {level}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{{
  "questions": [
    {{
      "id": 1,
      "question": "Question text here",
      "type": "open",
      "hint": "A helpful hint if the student is stuck"
    }},
    {{
      "id": 2,
      "question": "Question text here",
      "type": "open",
      "hint": "A helpful hint if the student is stuck"
    }},
    {{
      "id": 3,
      "question": "Question text here",
      "type": "open",
      "hint": "A helpful hint if the student is stuck"
    }}
  ],
  "topic": "{state['topic']}",
  "level": "{level}"
}}

For beginners: test basic recall and understanding.
For intermediate: test application and reasoning.
For advanced: test analysis, edge cases, and trade-offs.
"""

    response = await llm.ainvoke([SystemMessage(content=system_prompt)])

    #  Parse the JSON response 
    # Strip any accidental markdown code fences (```json ... ```)
    raw = response.content.strip()
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        quiz_data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse quiz JSON: {raw}")
        # Graceful fallback — return a simple error message
        return {
            "response": "I had trouble generating a quiz. Please try again.",
            "next_agent": "progress_tracker",
        }

    # Mark that we're waiting for the student's answer to Q1
    quiz_data["current_question_index"] = 0
    quiz_data["awaiting_answer"] = True
    quiz_data["scores"] = []

    # Format the first question for display
    first_q = quiz_data["questions"][0]
    reply = (
        f"## Quiz Time! 🎯\n\n"
        f"I have **3 questions** for you on **{state['topic']}**.\n\n"
        f"**Question 1 of 3:**\n\n{first_q['question']}\n\n"
        f"*Take your time and answer in your own words.*"
    )

    logger.info("Quiz generated successfully")

    return {
        "messages": [
            {"role": "user", "content": state["current_input"]},
            {"role": "assistant", "content": reply, "agent": "quiz_agent"},
        ],
        "response": reply,
        "quiz_data": quiz_data,
        "next_agent": "progress_tracker",
    }


async def _evaluate_answer(state: AgentState) -> dict:
    """
    Evaluate the student's answer to the current quiz question.
    Score it 0–1 and move to the next question or finish the quiz.
    """
    # IMPORTANT: copy.deepcopy here, not a plain reference.
    # state["quiz_data"] is the SAME object the API layer holds as
    # session.quiz_state. If we mutate it directly, we mutate that
    # object too — which can confuse SQLAlchemy's change-tracking
    # when the API tries to save "the new value" back to the DB
    # (it may look identical-by-reference to "the old value").
    # Working on a fresh copy keeps this node's output cleanly
    # independent of whatever object the caller passed in.
    import copy
    quiz_data = copy.deepcopy(state["quiz_data"])
    questions = quiz_data["questions"]
    idx = quiz_data["current_question_index"]
    current_q = questions[idx]

    logger.info(f"Evaluating answer for Q{idx + 1}")

    system_prompt = f"""You are a fair, encouraging quiz evaluator.

Topic: {state['topic']}
Student level: {state.get('learning_level', 'beginner')}

Question: {current_q['question']}
Student's answer: {state['current_input']}

Evaluate the answer and respond ONLY with valid JSON (no markdown):
{{
  "score": 0.0,
  "is_correct": false,
  "feedback": "Specific, encouraging feedback explaining what was right/wrong",
  "correct_answer": "The ideal answer in 1-2 sentences"
}}

Scoring guide:
  1.0 = Fully correct and well-explained
  0.7 = Mostly correct, minor gaps
  0.5 = Partially correct, key concepts present
  0.3 = Some understanding shown but significant gaps
  0.0 = Incorrect or off-topic

Always be encouraging regardless of score. Acknowledge what the student got right.
"""

    response = await llm.ainvoke([SystemMessage(content=system_prompt)])
    raw = response.content.strip()
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        evaluation = json.loads(raw)
    except json.JSONDecodeError:
        evaluation = {"score": 0.5, "feedback": "Good effort!", "correct_answer": ""}

    # Record the score 
    scores = quiz_data.get("scores", [])
    scores.append(evaluation["score"])
    quiz_data["scores"] = scores

    # Build feedback message 
    score_emoji = "🌟" if evaluation["score"] >= 0.8 else "💪" if evaluation["score"] >= 0.5 else "📚"
    feedback_text = (
        f"{score_emoji} **Score: {int(evaluation['score'] * 100)}%**\n\n"
        f"{evaluation['feedback']}\n\n"
        f"**Model answer:** {evaluation['correct_answer']}"
    )

    # Move to next question or finish 
    next_idx = idx + 1

    if next_idx < len(questions):
        # More questions remain
        quiz_data["current_question_index"] = next_idx
        next_q = questions[next_idx]
        reply = (
            f"{feedback_text}\n\n"
            f"---\n\n"
            f"**Question {next_idx + 1} of {len(questions)}:**\n\n"
            f"{next_q['question']}"
        )
    else:
        # Quiz complete — calculate final score
        avg_score = sum(scores) / len(scores)
        quiz_data["awaiting_answer"] = False
        quiz_data["final_score"] = avg_score

        grade = "Excellent! 🏆" if avg_score >= 0.8 else "Good work! 🌟" if avg_score >= 0.6 else "Keep practicing! 💪"
        reply = (
            f"{feedback_text}\n\n"
            f"---\n\n"
            f"## Quiz Complete! 🎉\n\n"
            f"**Final Score: {int(avg_score * 100)}%** — {grade}\n\n"
            f"Individual scores: {' | '.join(f'Q{i+1}: {int(s*100)}%' for i, s in enumerate(scores))}"
        )

    return {
        "messages": [
            {"role": "user", "content": state["current_input"]},
            {"role": "assistant", "content": reply, "agent": "quiz_agent"},
        ],
        "response": reply,
        "quiz_data": quiz_data,
        "current_session_score": quiz_data.get("final_score", state.get("current_session_score", 0.0)),
        "next_agent": "progress_tracker",
    }