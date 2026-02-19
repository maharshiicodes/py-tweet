from sqlmodel import SQLModel
# from sqlalchemy.ext.asyncio import create_async_engine
# from config import settings
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy.orm import sessionmaker
# engine = create_async_engine(
#     url = settings.DATABASE_URL,
#     echo = True,
#     future = True,
# )
#
# async def init_db():
#     async with engine.begin() as conn:
#         # await conn.execute(text('DROP TABLE IF EXISTS "userfollow" CASCADE;'))
#         # await conn.execute(text('DROP TABLE IF EXISTS "tweetlike" CASCADE;'))
#         # await conn.execute(text('DROP TABLE IF EXISTS "tweet" CASCADE;'))
#         # await conn.execute(text('DROP TABLE IF EXISTS "user" CASCADE;'))
#         # await conn.run_sync(SQLModel.metadata.drop_all)
#         await conn.run_sync(SQLModel.metadata.create_all)
#
# async def get_session() -> AsyncSession:
#     async_session = sessionmaker(
#         engine, class_=AsyncSession, expire_on_commit = False
#     )
#     async with async_session() as session:
#         yield session
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from config import settings


# 1. Get and Clean the DATABASE_URL
def get_async_url():
    # Use settings.DATABASE_URL or os.getenv directly as a fallback
    url = os.getenv("DATABASE_URL") or settings.DATABASE_URL

    if not url:
        return ""

    # Fix the prefix: Render/Neon usually provide 'postgres://'
    # SQLAlchemy async needs 'postgresql+asyncpg://'
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Strip accidental spaces or newlines from Vercel/Render UI
    return url.strip()


# 2. Create the Async Engine
engine = create_async_engine(
    url=get_async_url(),
    echo=True,  # Set to False in production to clean up logs
    future=True,  # Enforces SQLAlchemy 2.0 style
)


# 3. Database Initialization
async def init_db():
    async with engine.begin() as conn:
        # This creates your tables based on your SQLModel classes
        await conn.run_sync(SQLModel.metadata.create_all)


# 4. Dependency for FastAPI endpoints
async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session