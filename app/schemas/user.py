from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_superuser: bool
    avatar_url: Optional[str] = None
    estado: Optional[str] = None
    rede: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class UpdateProfile(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    estado: Optional[str] = None
    rede: Optional[str] = None


# ============================================================
# MULTI-API KEY — Gemini (Bloco multi-API)
# ============================================================
class GeminiKeyIn(BaseModel):
    """Payload para cadastro da chave do Gemini."""
    api_key: str = Field(..., min_length=20, max_length=200)


class GeminiKeyOut(BaseModel):
    """Status da chave do Gemini (sempre mascarada)."""
    tem_chave: bool
    chave_mascarada: Optional[str] = None
    data_cadastro: Optional[datetime] = None
    mensagem: Optional[str] = None