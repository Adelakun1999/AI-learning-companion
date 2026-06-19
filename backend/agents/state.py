from typing import Annotated , Any , Optional
from typing_extensions import TypedDict
import operator

class AgentState(TypedDict):
    #student context
    user_id : str        #who is studying
    session_id : str     # which session
    topic : str          # what topic
    learning_level : str #beginner/intermediate/ advanced

    #converations

    messages : Annotated[list[dict], operator.add]
    current_input : str # what the student just typed
    next_agent : str    #where to go next
    response : str      # what to send back to the student
    quiz_data : Optional[dict] # Active quiz state
    current_session_score : float
    session_summary : Optional[str]