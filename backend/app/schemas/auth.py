from pydantic import BaseModel, EmailStr, Field


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str | None = Field(default=None, max_length=80)
