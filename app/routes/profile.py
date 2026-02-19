from typing import List
from fastapi import APIRouter,HTTPException,status,Depends,Form,UploadFile,File,Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select,func,col
from app.db.models import User,UserFollow,Tweet
from app.db.main import get_session
from app.schemas import User_Profile,TweetPost
import shutil
import os

router = APIRouter()


@router.get("/{username}", response_model=User_Profile)
async def get_profile_details(
        username: str,
        current_user_id: int = Query(None),
        session: AsyncSession = Depends(get_session)
):

    statement = select(User).options(selectinload(User.tweets)).where(User.username == username)
    result = await session.execute(statement)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    followers_query = select(func.count(UserFollow.id)).where(UserFollow.followed_id == user.id)
    followers_count = (await session.execute(followers_query)).one()[0]

    following_query = select(func.count(UserFollow.id)).where(UserFollow.follower_id == user.id)
    following_count = (await session.execute(following_query)).one()[0]

    is_following = False
    if current_user_id:
        check_query = select(UserFollow).where(
            UserFollow.follower_id == current_user_id,
            UserFollow.followed_id == user.id
        )
        if (await session.execute(check_query)).first():
            is_following = True


    return User_Profile(
        id = user.id,
        username=user.username,
        bio=user.bio,
        created_at=user.created_at,
        tweets=user.tweets,
        profile_pic=user.profile_pic,
        banner_pic=user.banner_pic,
        followers=followers_count,
        following=following_count,
        is_following=is_following
    )

@router.get("/tweet/{user_id}",response_model =  List[TweetPost] or None)
async def get_personal_tweets(user_id : int , session: AsyncSession = Depends(get_session)):
    statement = select(Tweet).where(Tweet.user_id == user_id).order_by(Tweet.created_at.desc())
    result = await session.execute(statement)
    tweets = result.scalars().all()

    if not tweets:
        raise HTTPException(status_code=404, detail="tweets not found")
    return tweets

@router.post("/follow/{target_username}")
async def toggle_follow(
        target_username: str,
        current_user_id: int = Query(...),
        session: AsyncSession = Depends(get_session)
):

    statement = select(User).where(User.username == target_username)
    target_user = (await session.execute(statement)).scalars().first()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")


    check_stmt = select(UserFollow).where(
        UserFollow.follower_id == current_user_id,
        UserFollow.followed_id == target_user.id
    )
    existing_follow = (await session.execute(check_stmt)).scalar_one_or_none()

    if existing_follow:
        await session.delete(existing_follow)
        action = "unfollowed"
    else:
        new_follow = UserFollow(follower_id=current_user_id, followed_id=target_user.id)
        session.add(new_follow)
        action = "followed"

    await session.commit()
    return {"action": action}

@router.put("/update/{username}")
async def update_profile_details(username : str,
                                 bio : str | None = Form(None),
                                 profile_pic : UploadFile | None = File(None) ,
                                 banner_pic : UploadFile | None = File(None) ,
                                 session : AsyncSession = Depends(get_session)):
    statement = select(User).where(User.username == username)
    result = await session.execute(statement)
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,)

    if bio:
        user.bio = bio
    if profile_pic:
        file_location = f"static/images/{username}_profile.jpg"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(profile_pic.file,file_object)
            user.profile_pic =  f"images/{username}_profile.jpg"
    if banner_pic:
        file_location = f"static/images/{username}_banner.jpg"
        with open(file_location , "wb+") as banner_object:
            shutil.copyfileobj(banner_pic.file,banner_object)

            user.banner_pic = f"images/{username}_banner.jpg"
    await session.commit()
    await session.refresh(user)

    return user