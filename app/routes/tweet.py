from fastapi import APIRouter, HTTPException, status, Depends,Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select
from app.db.models import Tweet,TweetLike,TweetRepost,TweetBookmark
from app.db.main import get_session
from typing import List
from app.schemas import TweetCreate, TweetPost , CommentOut
from datetime import datetime
from sqlalchemy import or_

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


# 1. GET SINGLE TWEET (For the top of comment.html)
@router.get("/tweet/single/{tweet_id}" , response_model= TweetPost)
async def get_single_tweet(tweet_id: int, session: AsyncSession = Depends(get_session)):
    # Fetch tweet with user details
    statement = select(Tweet).where(Tweet.id == tweet_id).options(selectinload(Tweet.user))
    result = await session.execute(statement)
    tweet = result.scalar_one_or_none()

    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")

    return tweet


# 2. POST A COMMENT
from app.db.models import Comment  # Make sure to import Comment


@router.post("/tweet/{tweet_id}/comment")
async def post_comment(
        tweet_id: int,
        content: str,  # We can accept simple string or a Pydantic schema
        user_id: int = Query(...),
        session: AsyncSession = Depends(get_session)
):
    # Check if tweet exists
    tweet = await session.get(Tweet, tweet_id)
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")

    # Create Comment
    new_comment = Comment(
        content=content,
        user_id=user_id,
        tweet_id=tweet_id,
        created_at=datetime.now()
    )

    session.add(new_comment)

    # Increment comment count on the Tweet manually
    tweet.comments += 1
    session.add(tweet)

    await session.commit()
    await session.refresh(new_comment)
    return new_comment


# 3. GET COMMENTS FOR A TWEET
@router.get("/tweet/{tweet_id}/comments" , response_model=List[CommentOut])
async def get_comments(tweet_id: int, session: AsyncSession = Depends(get_session)):
    statement = (
        select(Comment)
        .where(Comment.tweet_id == tweet_id)
        .options(selectinload(Comment.user))  # Load user to show profile pic
        .order_by(Comment.created_at.desc())
    )
    result = await session.execute(statement)
    comments = result.scalars().all()
    return comments

#4.Repost  a tweet
@router.post("/tweet/{tweet_id}/repost")
async def repost_tweet(tweet_id: int, user_id: int = Query(...), session: AsyncSession = Depends(get_session)):
    # Check if already reposted
    statement = select(TweetRepost).where(TweetRepost.user_id == user_id, TweetRepost.tweet_id == tweet_id)
    result = await session.execute(statement)
    existing = result.scalar_one_or_none()

    tweet = await session.get(Tweet, tweet_id)
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")

    if existing:
        await session.delete(existing)
        tweet.reposts -= 1
        action = "removed"
    else:
        new_repost = TweetRepost(user_id=user_id, tweet_id=tweet_id)
        session.add(new_repost)
        tweet.reposts += 1
        action = "reposted"

    session.add(tweet)
    await session.commit()
    return {"reposts": tweet.reposts, "action": action}


@router.post("/tweet/{tweet_id}/bookmark")
async def bookmark_tweet(tweet_id: int, user_id: int = Query(...), session: AsyncSession = Depends(get_session)):
    statement = select(TweetBookmark).where(TweetBookmark.user_id == user_id, TweetBookmark.tweet_id == tweet_id)
    result = await session.execute(statement)
    existing = result.scalar_one_or_none()

    tweet = await session.get(Tweet, tweet_id)
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")

    if existing:
        await session.delete(existing)
        tweet.bookmarks -= 1
        action = "unsaved"
    else:
        new_bookmark = TweetBookmark(user_id=user_id, tweet_id=tweet_id)
        session.add(new_bookmark)
        tweet.bookmarks += 1
        action = "saved"

    session.add(tweet)
    await session.commit()
    return {"bookmarks": tweet.bookmarks, "action": action}


@router.get("/profile/{target_user_id}/posts" , response_model=List[TweetPost])
async def get_profile_mixed_posts(target_user_id: int, session: AsyncSession = Depends(get_session)):


    repost_subquery = select(TweetRepost.tweet_id).where(TweetRepost.user_id == target_user_id)

    statement = (
        select(Tweet)
        .where(
            or_(
                Tweet.user_id == target_user_id,
                Tweet.id.in_(repost_subquery)
            )
        )
        .options(selectinload(Tweet.user))
        .order_by(Tweet.created_at.desc())
    )

    result = await session.execute(statement)
    return result.scalars().all()

@router.get("/profile/{target_user_id}/saved" , response_model= List[TweetPost])
async def get_profile_saved_posts(target_user_id: int, session: AsyncSession = Depends(get_session)):
    # Logic: Join Tweet table with Bookmark table
    statement = (
        select(Tweet)
        .join(TweetBookmark, Tweet.id == TweetBookmark.tweet_id)
        .where(TweetBookmark.user_id == target_user_id)
        .options(selectinload(Tweet.user))
        .order_by(TweetBookmark.created_at.desc())
    )
    result = await session.execute(statement)
    return result.scalars().all()