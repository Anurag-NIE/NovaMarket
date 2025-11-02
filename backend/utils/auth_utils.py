# backend/utils/auth_utils.py
"""
Authentication utilities: JWT tokens, password hashing, user validation
"""
from fastapi import HTTPException, Header
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import jwt
from config import settings
from database import get_db
from models import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRATION_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)) -> User:
    """
    Get current authenticated user from JWT token
    
    Usage:
        current_user: User = Depends(get_current_user)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    db = get_db()
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert timestamp to created_at if needed
    if isinstance(user_doc.get('timestamp'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc.pop('timestamp'))
    
    return User(**user_doc)

def require_role(allowed_roles: list):
    """
    Decorator to require specific user roles
    
    Usage:
        @require_role(["seller"])
        async def seller_only_route(current_user: User = Depends(get_current_user)):
            ...
    """
    async def role_checker(current_user: User):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker