"""
Schemas do Motor 8 — Banco de Questões Curado.

IMPORTANTE: este arquivo é 100% NOVO. Não substitui nem altera nenhum schema
existente. O Motor 7 (ENEM) continua usando `question_bank.py`.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# ESTATÍSTICAS
# ============================================================
class StatsGroup(BaseModel):
    """Um grupo de estatística (chave + quantidade)."""
    chave: str
    quantidade: int


class QuestionStats(BaseModel):
    """Estatísticas gerais do banco de questões."""
    total: int
    por_componente: List[StatsGroup]
    por_ano: List[StatsGroup]
    por_etapa: List[StatsGroup]
    por_referencial: List[StatsGroup]
    por_origem: List[StatsGroup]


# ============================================================
# HABILIDADES DISPONÍVEIS
# ============================================================
class HabilidadeDisponivel(BaseModel):
    """Uma habilidade que possui questões no banco."""
    codigo: str
    texto: Optional[str] = None
    componente: Optional[str] = None
    ano: Optional[int] = None
    etapa: Optional[str] = None
    referencial: Optional[str] = None
    total_questoes: int


class HabilidadesDisponiveisResponse(BaseModel):
    """Lista paginada de habilidades disponíveis."""
    items: List[HabilidadeDisponivel]
    total: int


# ============================================================
# BUSCA ESTENDIDA
# ============================================================
class QuestionListItemExt(BaseModel):
    """Item resumido da busca estendida (Motor 8)."""
    id: UUID
    fonte: str
    ano: Optional[int] = None
    etapa: Optional[str] = None
    serie: Optional[str] = None
    componente: Optional[str] = None
    disciplina: Optional[str] = None
    habilidade_codigo: Optional[str] = None
    referencial: Optional[str] = None
    origem: Optional[str] = None
    tipo: Optional[str] = None
    numero: Optional[int] = None
    preview: str

    class Config:
        from_attributes = True


class QuestionSearchExtResponse(BaseModel):
    """Resposta da busca estendida do Motor 8."""
    items: List[QuestionListItemExt]
    total: int
    page: int
    per_page: int
    total_pages: int