from fastapi import APIRouter, HTTPException, status, Depends,Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select
from app.db.models import Tweet,TweetLike
from app.db.main import get_session
from typing import List
from app.schemas import TweetCreate, TweetPost
from datetime import datetime

router = APIRouter()



@router.post("/tweet/")
async def post_tweet(tweet_data: TweetCreate, user_id: int = Query(...), session: AsyncSession = Depends(get_session)):
    new_tweet = Tweet(
        content=tweet_data.content,
        user_id=user_id,
        created_at=datetime.now(),
        likes=0,
        reposts=0,
        comments=0,
        bookmarks=0,
    )

    session.add(new_tweet)
    await session.commit()
    await session.refresh(new_tweet)

    return new_tweet



@router.get("/feed",response_model=List[TweetPost])
async def get_global_feed(session: AsyncSession = Depends(get_session)):
    statement = (
        select(Tweet)
        .options(selectinload(Tweet.user))
        .order_by(Tweet.created_at.desc())
    )
    result = await session.execute(statement)
    tweets = result.scalars().all()
    return tweets



@router.delete("/tweet/{tweet_id}/")
async def delete_tweet(tweet_id: int, user_id: int, session: AsyncSession = Depends(get_session)):
    tweet = await session.get(Tweet, tweet_id)

    if not tweet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tweet not found")
    if tweet.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can't delete this tweet")

    await session.delete(tweet)
    await session.commit()

    return {"message": "Tweet deleted successfully"}



@router.get("/tweet/{user_id}")
async def get_personal_tweet(user_id: int, session: AsyncSession = Depends(get_session)):
    statement = (select(Tweet)
                 .where(Tweet.user_id == user_id)).options(selectinload(Tweet.user)).order_by(Tweet.created_at.desc())
    result = await session.execute(statement)
    if result:
        tweets = result.scalars().all()
        return tweets


@router.put("/tweet/{tweet_id}/like")
async def like_tweet(
    tweet_id: int,
    user_id: int = Query(...),
    session: AsyncSession = Depends(get_session)
):

    tweet = await session.get(Tweet, tweet_id)
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")


    statement = select(TweetLike).where(
        TweetLike.user_id == user_id,
        TweetLike.tweet_id == tweet_id
    )
    result = await session.execute(statement)
    existing_like = result.scalar_one_or_none()

    if existing_like:

        await session.delete(existing_like)
        tweet.likes -= 1
        action = "unliked"
    else:

        new_like = TweetLike(user_id=user_id, tweet_id=tweet_id)
        session.add(new_like)
        tweet.likes += 1
        action = "liked"

    session.add(tweet)
    await session.commit()
    await session.refresh(tweet)

    return {"likes": tweet.likes, "action": action}