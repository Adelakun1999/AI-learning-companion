from typing import Annotated , Any , Optional
from typing_extensions import TypedDict
import operator

class AgentState(TypedDict):
    #student context
    user_id : str
    session_id : str 
    topic : str 
    learning_level : str 

    #converations

    messages : Annotated[list[dict], operator.add]
    current_input : str 
    next_agent : str 
    response : str 
    quiz_data : Optional[dict]
    current_session_score : float
    session_summary : Optional[str]