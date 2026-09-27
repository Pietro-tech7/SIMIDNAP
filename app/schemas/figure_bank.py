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
    categoria: str
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
    categoria: Optional[str] = Field(None, max_length=50)
    subcategoria: Optional[str] = Field(None, max_length=100)
    keywords: Optional[List[str]] = None
    aprovada: Optional[bool] = None


# ============================================================
# UPLOAD (retorno)
# ============================================================
class FigureBankUploadItem(BaseModel):
    """Item retornado no upload (sucesso)"""
    id: UUID
    nome: str
    categoria: str
    mime_type: str
    file_size: int


class FigureBankUploadError(BaseModel):
    """Erro específico de um arquivo no upload em lote"""
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