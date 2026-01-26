from pydantic import BaseModel , EmailStr
from typing import Optional,List

class User_Create(BaseModel):
    username : str
    email : EmailStr
    password : str

class User_Login(BaseModel):
    identifier : str | EmailStr
    password : str

class Tweet_create(BaseModel):
    content : str

class User_Profile(BaseModel):
    username : str
    bio : Optional[str] = None
    followers : int = 0
    following : int =  0
    tweets : List[Tweet_create] = []