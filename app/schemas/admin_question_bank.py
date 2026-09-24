"""
Schemas do Painel Admin de Curadoria do Banco de Questões Fundamental.
100% NOVO. Não altera nada existente.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# ITEM DE QUESTÃO (listagem admin)
# ============================================================
class AdminQuestionItem(BaseModel):
    id: UUID
    fonte: Optional[str] = None
    ano: Optional[int] = None
    etapa: str
    serie: Optional[str] = None
    componente: Optional[str] = None
    disciplina: Optional[str] = None
    numero: Optional[int] = None
    tipo: Optional[str] = None
    enunciado: str
    alternativas: Optional[List[Dict[str, Any]]] = None
    gabarito: Optional[str] = None
    imagem_url: Optional[str] = None
    habilidade_codigo: Optional[str] = None
    referencial: Optional[str] = None
    descritores: Optional[List[str]] = None
    dificuldade: Optional[str] = None
    origem: str
    approved: bool
    submitted_by: Optional[UUID] = None
    submitted_by_email: Optional[str] = None
    submitted_by_name: Optional[str] = None
    created_at: datetime
    trashed_at: Optional[datetime] = None
    dias_ate_exclusao: Optional[int] = None

    class Config:
        from_attributes = True


class AdminQuestionListResponse(BaseModel):
    items: List[AdminQuestionItem]
    total: int
    page: int
    per_page: int
    total_pages: int


# ============================================================
# EDIÇÃO
# ============================================================
class AdminQuestionUpdate(BaseModel):
    enunciado: Optional[str] = None
    alternativas: Optional[List[Dict[str, Any]]] = None
    gabarito: Optional[str] = None
    habilidade_codigo: Optional[str] = None
    referencial: Optional[str] = None
    ano: Optional[int] = None
    etapa: Optional[str] = None
    serie: Optional[str] = None
    componente: Optional[str] = None
    disciplina: Optional[str] = None
    imagem_url: Optional[str] = None
    descritores: Optional[List[str]] = None


# ============================================================
# APROVAÇÃO EM LOTE
# ============================================================
class AdminQuestionApprovalRequest(BaseModel):
    ids: List[UUID] = Field(..., min_items=1, max_items=100)


# ============================================================
# ESTATÍSTICAS
# ============================================================
class AdminQuestionStatsItem(BaseModel):
    chave: str
    quantidade: int


class AdminQuestionStats(BaseModel):
    total_pendentes: int
    total_aprovadas: int
    total_anuladas: int
    por_autor: List[AdminQuestionStatsItem]
    por_componente: List[AdminQuestionStatsItem]
    por_referencial: List[AdminQuestionStatsItem]


# ============================================================
# CRIAÇÃO MANUAL DE QUESTÃO (Bloco 3.5.1)
# ============================================================
class AdminQuestionCreate(BaseModel):
    """Payload para criar uma questão manualmente pelo admin."""
    etapa: str = Field(..., description="'EI' ou 'EF'")
    ano: Optional[int] = Field(None, ge=1, le=9)
    serie: Optional[str] = Field(None, max_length=50)
    componente: str = Field(..., max_length=10)
    disciplina: Optional[str] = Field(None, max_length=100)
    referencial: Optional[str] = Field("bncc", max_length=30)
    habilidade_codigo: Optional[str] = Field(None, max_length=50)
    descritores: Optional[List[str]] = None
    dificuldade: Optional[str] = Field(None, max_length=20)

    tipo: str = Field("multipla_escolha", max_length=30)
    enunciado: str = Field(..., min_length=10)
    alternativas: Optional[List[Dict[str, Any]]] = None
    gabarito: Optional[str] = None
    imagem_url: Optional[str] = None
    imagens_extras: Optional[List[str]] = None

    # Se True, a questão entra já aprovada (padrão no admin)
    aprovada: bool = Field(True)