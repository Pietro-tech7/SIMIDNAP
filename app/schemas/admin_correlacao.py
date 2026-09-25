"""
Schemas do Painel Admin de Correlações Habilidade ↔ Descritor.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class CorrelacaoItem(BaseModel):
    id: UUID
    habilidade_codigo: str
    habilidade_texto: Optional[str] = None
    unidade_tematica: Optional[str] = None
    objeto_conhecimento: Optional[str] = None
    confianca: str
    revisado: bool


class DescritorComCorrelacoes(BaseModel):
    descritor_id: UUID
    fonte: str
    componente: str
    ano: Optional[int] = None
    codigo: str
    texto: str
    tema: Optional[str] = None
    correlacoes: List[CorrelacaoItem]


class CorrelacaoListResponse(BaseModel):
    items: List[DescritorComCorrelacoes]
    total: int
    page: int
    per_page: int
    total_pages: int


class CorrelacaoStats(BaseModel):
    total_descritores: int
    total_correlacoes: int
    correlacoes_revisadas: int
    correlacoes_pendentes: int
    por_confianca: dict
    por_componente: dict


class AprovarCorrelacaoRequest(BaseModel):
    confianca: Optional[str] = Field(None, description="'alta' | 'media' | 'baixa'")


class CorrelacaoManualCreate(BaseModel):
    habilidade_codigo: str = Field(..., max_length=20)
    descritor_id: UUID
    confianca: str = Field("alta", description="'alta' | 'media' | 'baixa'")