from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class ReflectionStart(BaseModel):
    theme: Optional[str] = None  # ex: 'relacao_professor_aluno', 'gestao_conflitos'
    title: Optional[str] = None  # título opcional dado pelo professor


class ReflectionMessage(BaseModel):
    content: str  # mensagem do professor


class ReflectionOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    theme: Optional[str]
    messages: List[Dict[str, Any]]
    summary: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReflectionMessageOut(BaseModel):
    """Resposta após enviar uma mensagem — retorna a reflection atualizada."""
    reflection: ReflectionOut
    reply: Dict[str, Any]  # a resposta do "terapeuta"