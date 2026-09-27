"""
Schemas do Banco de Figuras (Bloco F).
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ============================================================
# ITEM DE FIGURA (listagem admin)
# ============================================================
class FigureBankItem(BaseModel):
    id: UUID
    nome: str
    categoria: Optional[str] = None
    categorias: List[str] = Field(default_factory=list)
    subcategoria: Optional[str] = None
    keywords: Optional[List[str]] = None
    mime_type: str
    file_size: Optional[int] = None
    uploaded_by: Optional[UUID] = None
    uploaded_by_nome: Optional[str] = None
    aprovada: bool
    origem: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FigureBankListResponse(BaseModel):
    items: List[FigureBankItem]
    total: int
    page: int
    per_page: int
    total_pages: int


# ============================================================
# EDIÇÃO
# ============================================================
class FigureBankUpdate(BaseModel):
    nome: Optional[str] = Field(None, max_length=200)
    categorias: Optional[List[str]] = None
    subcategoria: Optional[str] = Field(None, max_length=100)
    keywords: Optional[List[str]] = None
    aprovada: Optional[bool] = None


# ============================================================
# UPLOAD (retorno)
# ============================================================
class FigureBankUploadItem(BaseModel):
    id: UUID
    nome: str
    categorias: List[str] = Field(default_factory=list)
    mime_type: str
    file_size: int


class FigureBankUploadError(BaseModel):
    filename: str
    motivo: str


class FigureBankUploadResponse(BaseModel):
    sucesso: bool
    total_enviado: int
    total_sucesso: int
    total_erro: int
    itens: List[FigureBankUploadItem] = Field(default_factory=list)
    erros: List[FigureBankUploadError] = Field(default_factory=list)


# ============================================================
# AÇÕES EM LOTE
# ============================================================
class FigureBankBatchIds(BaseModel):
    """Usado por: delete em lote, aprovar em lote, desaprovar em lote."""
    ids: List[UUID] = Field(..., min_items=1, max_items=500)


class FigureBankBatchCategorize(BaseModel):
    """Usado por: categorizar em lote."""
    ids: List[UUID] = Field(..., min_items=1, max_items=500)
    categorias: List[str] = Field(..., min_items=1)
    modo: str = Field(
        "substituir",
        description="'substituir' (troca todas) | 'adicionar' (soma às existentes)",
    )


# ============================================================
# IA VISION — CLASSIFICAÇÃO
# ============================================================
class FigureBankClassifyResponse(BaseModel):
    nome: str
    categorias: List[str] = Field(default_factory=list)
    subcategoria: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)


# ============================================================
# ESTATÍSTICAS
# ============================================================
class FigureBankStatsItem(BaseModel):
    chave: str
    quantidade: int


class FigureBankStats(BaseModel):
    total_figuras: int
    total_aprovadas: int
    total_pendentes: int
    por_categoria: List[FigureBankStatsItem]
    por_origem: List[FigureBankStatsItem]