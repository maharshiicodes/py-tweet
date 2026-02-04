from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine
from config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
engine = create_async_engine(
    url = settings.DATABASE_URL,
    echo = True,
    future = True,
)

async def init_db():
    async with engine.begin() as conn:
        # await conn.execute(text('DROP TABLE IF EXISTS "userfollow" CASCADE;'))
        # await conn.execute(text('DROP TABLE IF EXISTS "tweetlike" CASCADE;'))
        # await conn.execute(text('DROP TABLE IF EXISTS "tweet" CASCADE;'))
        # await conn.execute(text('DROP TABLE IF EXISTS "user" CASCADE;'))

        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit = False
    )
    async with async_session() as session:
        yield session