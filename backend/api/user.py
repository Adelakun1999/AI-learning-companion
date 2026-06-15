from fastapi import APIRouter , Depends
from backend.core.dependencies import get_current_user
from backend.db.models import User

router = APIRouter(
    prefix="/user",
    tags=['User']
)

@router.get("/me")
async def get_my_profile(
        current_user : User = Depends(get_current_user)
):
    return {
        "id" : current_user.id,
        "name" : current_user.name,
        "email" : current_user.email
    }