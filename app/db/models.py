from typing import Optional,List
from sqlmodel import SQLModel,Field,Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id : Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index = True , unique = True)
    email: str = Field(index = True , unique = True)
    password_hash : str
    bio : Optional[str] = Field(default = None)
    profile_pic : Optional[str] = Field(default = None)
    banner_pic : Optional[str] = Field(default = None)
    created_at: datetime = Field(default_factory=datetime.now)
    tweets : List["Tweet"] = Relationship(back_populates="user")
    # followers : List["User"] = Relationship(back_populates = "followers")
    # followings : List["User"] = Relationship(back_populates = "followings")

class Tweet(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    content : str
    user_id :int = Field(foreign_key = 'user.id')
    created_at: datetime = Field(default_factory=datetime.now)
    user : Optional[User] = Relationship(back_populates = 'tweets')
    likes : int = Field(default = 0)
    reposts : int = Field(default = 0)
    comments : int = Field(default = 0)
    bookmarks : int = Field(default = 0)

class TweetLike(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    tweet_id: int = Field(foreign_key="tweet.id")

class UserFollow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    follower_id: int = Field(foreign_key="user.id")
    followed_id: int = Field(foreign_key="user.id")