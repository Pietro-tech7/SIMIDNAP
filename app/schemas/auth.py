from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    estado: Optional[str] = None   # UF: 'PI', 'MA', ...
    rede: Optional[str] = None     # 'estadual' | 'municipal' | 'privada' | 'outro'


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"