from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class PedagogicalCaseCreate(BaseModel):
    title: str
    grade: Optional[str] = None
    subject: Optional[str] = None
    description: str
    # Campos opcionais de investigação estruturada
    frequencia: Optional[str] = None
    situacoes: Optional[str] = None
    reacao_aluno: Optional[str] = None
    ja_tentou: Optional[str] = None
    contexto_adicional: Optional[str] = None


class PedagogicalCaseUpdate(BaseModel):
    title: Optional[str] = None
    grade: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    frequencia: Optional[str] = None
    situacoes: Optional[str] = None
    reacao_aluno: Optional[str] = None
    ja_tentou: Optional[str] = None
    contexto_adicional: Optional[str] = None
    notes: Optional[str] = None


class PedagogicalCaseAnalyzeResponse(BaseModel):
    compreensao: str
    hipoteses_pedagogicas: List[str]
    intervencoes_sugeridas: List[str]
    como_acompanhar: List[str]
    encaminhamento: Optional[str] = None


class PedagogicalCaseOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    grade: Optional[str]
    subject: Optional[str]
    description: str
    frequencia: Optional[str]
    situacoes: Optional[str]
    reacao_aluno: Optional[str]
    ja_tentou: Optional[str]
    contexto_adicional: Optional[str]
    analysis: Optional[Dict[str, Any]]
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True