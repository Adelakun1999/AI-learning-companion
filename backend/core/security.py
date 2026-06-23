from passlib.context import CryptContext
from backend.core.config import settings
from datetime import datetime , timedelta
from jose import JWTError , jwt
from typing import Optional




pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
        plain_password: str, hashed_password: str
):
    return pwd_context.verify(
    plain_password, hashed_password
    )

def create_access_token(data:dict)->str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire

    return jwt.encode(
        to_encode, 
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )



def decode_access_token(token: str) -> Optional[str]:
    """
    Decode and verify a JWT token.
    Returns the user_id (stored in 'sub' claim) or None if invalid.
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        # Token is expired, tampered with, or just invalid
        return None