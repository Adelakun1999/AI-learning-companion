from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.database import get_db
from backend.db.models import User
from backend.schemas.user import UserCreate, UserResponse , TokenResponse, UserLogin
from backend.core.security import hash_password, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user : UserCreate, db: AsyncSession = Depends(get_db)):
    #check if email already exists
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    #create new user
    user = User(
        name = user.name,
        email = user.email,
        hashed_password = hash_password(user.password),
        learning_level = user.learning_level
    )
    db.add(user)
    await db.flush()

    return user


@router.post("/login", response_model=TokenResponse)
async def login(body : UserLogin, db:AsyncSession=Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = create_access_token({"sub" : user.id})
    return TokenResponse(
        access_token=token , user=UserResponse.model_validate(user)
    )









