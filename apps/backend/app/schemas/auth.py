from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegisterSchema(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100, description="User full name")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 chars)")
    phone_number: Optional[str] = None

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponseSchema(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: Optional[str] = None

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class GoogleLoginSchema(BaseModel):
    email: EmailStr
    name: Optional[str] = "Google User"
