from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class LessonPlanGenerate(BaseModel):
    plan_type: str  # 'neuroaula' ou 'aula_que_funciona'
    title: str
    subject: Optional[str] = None
    grade: Optional[str] = None
    content: Optional[str] = None
    objective: Optional[str] = None

    # Campos específicos do NeuroAula
    bncc_codigo: Optional[str] = None
    bncc_texto: Optional[str] = None
    duracao_minutos: Optional[int] = None
    tipo_aula: Optional[str] = None
    num_alunos: Optional[int] = None
    dificuldades: Optional[str] = None
    conhecimentos_previos: Optional[str] = None
    necessidades_especificas: Optional[str] = None

    # Campo para versão diferenciada
    diferenciado: Optional[bool] = False

    extra: Optional[Dict[str, Any]] = None

class LessonPlanOut(BaseModel):
    id: UUID
    user_id: UUID
    plan_type: str
    title: str
    subject: Optional[str]
    grade: Optional[str]
    content: Optional[str]
    objective: Optional[str]
    structured_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True