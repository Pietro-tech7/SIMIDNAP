from pydantic import BaseModel, Field
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


# ============================================================
# ENTRADA — O que o frontend envia
# ============================================================
class FeedbackCreate(BaseModel):
    """
    Payload de autoavaliação do professor/coordenador.

    O feedback é salvo dentro do `structured_data` do conteúdo,
    sob a chave `feedback`, para evitar migração no banco.
    """
    content_type: Literal[
        "pratica_exitosa",
        "material",
        "neuroaula",
        "aula_que_funciona",
        "reflection",
        "pedagogical_case",
    ] = Field(..., description="Tipo de conteúdo avaliado")

    content_id: UUID = Field(..., description="ID do conteúdo")

    rating: Literal["positive", "partial", "negative"] = Field(
        ...,
        description="'positive' (👍) | 'partial' (🤔) | 'negative' (👎)"
    )

    comment: Optional[str] = Field(
        None,
        max_length=2000,
        description="Comentário opcional do professor (o que faltou, o que ficou bom, etc)"
    )


# ============================================================
# SAÍDA — O que a API devolve
# ============================================================
class FeedbackOut(BaseModel):
    """Feedback salvo (retornado para o admin ou para confirmar o envio)."""
    content_type: str
    content_id: UUID
    rating: str
    comment: Optional[str] = None
    created_at: datetime


class FeedbackAdminItem(BaseModel):
    """Item de feedback para o painel admin."""
    content_type: str
    content_id: UUID
    content_title: str
    rating: str
    comment: Optional[str] = None
    created_at: datetime
    user_id: UUID
    user_name: str
    user_email: str


class FeedbackStats(BaseModel):
    """Estatísticas agregadas de feedback."""
    total: int
    positive: int
    partial: int
    negative: int
    por_tipo: dict = Field(default_factory=dict)