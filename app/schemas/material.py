from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


class MaterialGenerate(BaseModel):
    material_type: str  # 'atividade_imprimivel', 'jogo_dinamica', 'simulado'
    title: str
    subject: Optional[str] = None
    grade: Optional[str] = None
    content: Optional[str] = None
    objective: Optional[str] = None
    bncc_codigo: Optional[str] = None
    bncc_texto: Optional[str] = None
    num_questoes: Optional[int] = None  # para simulado
    duracao_minutos: Optional[int] = None  # para jogo
    num_alunos: Optional[int] = None
    dificuldades: Optional[str] = None
    diferenciado: Optional[bool] = False  # NOVO: gera versão adaptada + versão principal


class MaterialOut(BaseModel):
    id: UUID
    user_id: UUID
    material_type: str
    title: str
    subject: Optional[str]
    grade: Optional[str]
    content: Optional[str]
    diferenciado: bool
    structured_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True