from passlib.context import CryptContext
from fastapi import APIRouter,HTTPException,status,Depends
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import User_Create , User_Login
from app.db.models import User
from app.db.main import get_session

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/signup" , status_code = 201)
async def create_user(
        user_data : User_Create,
        session : AsyncSession = Depends(get_session)):
    statement = select(User).where(
        (User.username == user_data.username) | (User.email == user_data.email)
    )
    result = await session.execute(statement)
    existing_user = result.first()

    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    hashed_password = pwd_context.hash(user_data.password)

    new_user = User(
        username = user_data.username,
        email = user_data.email,
        password_hash = hashed_password,
    )

    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return {"mesage" : "User created" , "user_id" : new_user.id}

@router.post("/signin" , status_code = 201)
async def login_user(user_credentials : User_Login , session : AsyncSession = Depends(get_session)):
    statement = select(User).where(
        (User.username == user_credentials.identifier) | (User.email == user_credentials.identifier)
    )
    result = await session.execute(statement)
    user = result.scalars().first()

    if not user or not pwd_context.verify(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    return {
        "message" : "Login successfull",
        "user_id" : user.id,
        "username" : user.username,
    }