from pydantic import BaseModel , EmailStr

class User_Create(BaseModel):
    username : str
    email : EmailStr
    password : str

class User_Login(BaseModel):
    identifier : str | EmailStr
    password : str