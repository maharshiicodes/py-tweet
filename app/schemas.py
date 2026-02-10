from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# 1. User Auth Schemas
class User_Create(BaseModel):
    username: str
    email: EmailStr
    password: str

class User_Login(BaseModel):
    identifier: str | EmailStr
    password: str

# 2. Public User Schema (For Feed)
class UserPublic(BaseModel):
    username: str
    profile_pic: Optional[str] = None

    class Config:
        from_attributes = True

# 3. Tweet Schemas
class TweetCreate(BaseModel):
    content: str

class TweetPost(BaseModel):
    id: int
    content: str
    created_at: datetime
    likes: int = 0
    reposts: int = 0
    comments: int = 0
    bookmarks: int = 0
    user_id: int
    user: Optional[UserPublic] = None
    #Did because profile and username were not appearing cause pydantic need dictonaries to fetch and we were sending objects brooo
    class Config:
        from_attributes = True

# 4. Profile Schema
class User_Profile(BaseModel):
    id : int
    username: str
    bio: Optional[str] = None
    created_at: datetime
    tweets: List[TweetPost] = []
    profile_pic: Optional[str] = None
    banner_pic: Optional[str] = None
    followers : int = 0
    following : int = 0
    is_following : bool = False

    class Config:
        from_attributes = True

#5.Schema for Comment
class UserRead(BaseModel):
     username : str
     profile_pic : Optional[str] = None

     class Config:
         from_attributes = True

class CommentOut(BaseModel):
    id : int
    content: str
    created_at: datetime
    user : Optional[UserRead] = None

    class Config:
        from_attributes = True