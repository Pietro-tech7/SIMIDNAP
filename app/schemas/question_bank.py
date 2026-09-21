from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# ALTERNATIVA
# ============================================================
class QuestionAlternative(BaseModel):
    """Uma alternativa de questão (A, B, C, D, E)."""
    letra: str = Field(..., description="'A', 'B', 'C', 'D' ou 'E'")
    texto: Optional[str] = None
    imagem_url: Optional[str] = None


# ============================================================
# ITEM DE LISTAGEM (leve, sem enunciado completo)
# ============================================================
class QuestionListItem(BaseModel):
    """Item resumido para a lista de busca."""
    id: UUID
    fonte: str
    ano: int
    etapa: str
    area: Optional[str]
    disciplina: Optional[str]
    numero: int
    tipo: Optional[str]

    # Prévia do enunciado (primeiros 200 caracteres)
    preview: str

    class Config:
        from_attributes = True


# ============================================================
# QUESTÃO COMPLETA
# ============================================================
class QuestionOut(BaseModel):
    """Questão completa com alternativas, gabarito e imagens."""
    id: UUID
    fonte: str
    ano: int
    etapa: str
    area: Optional[str]
    disciplina: Optional[str]
    numero: int
    tipo: Optional[str]
    cor_caderno: Optional[str]

    enunciado: str
    alternativas: Optional[List[QuestionAlternative]] = None
    gabarito: Optional[str] = None
    imagem_url: Optional[str] = None
    imagens_extras: Optional[List[str]] = None

    habilidades: Optional[List[str]] = None
    dificuldade: Optional[str] = None
    anulada: bool = False

    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# RESPOSTA DE BUSCA PAGINADA
# ============================================================
class QuestionSearchResponse(BaseModel):
    """Resultado de uma busca no banco de questões."""
    items: List[QuestionListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


# ============================================================
# FILTROS DISPONÍVEIS (para o frontend montar os selects)
# ============================================================
class QuestionFilters(BaseModel):
    """Metadados para montar os filtros no frontend."""
    fontes: List[str]
    anos: List[int]
    etapas: List[str]
    areas: List[str]
    disciplinas: List[str]


# ============================================================
# GERAÇÃO DE SIMULADO A PARTIR DO BANCO
# ============================================================
class GenerateSimuladoFromBank(BaseModel):
    """
    Payload para gerar um simulado escolhendo questões específicas do banco.
    """
    title: str = Field(..., max_length=200, description="Título do simulado")
    question_ids: List[UUID] = Field(
        ...,
        min_items=1,
        max_items=50,
        description="IDs das questões selecionadas (1 a 50)"
    )
    show_gabarito: bool = Field(True, description="Incluir gabarito no PDF")
    include_header: bool = Field(
        True,
        description="Incluir cabeçalho com logo SIMIDNAPE e linhas para nome/data"
    )
    instructions: Optional[str] = Field(
        None,
        max_length=500,
        description="Instruções extras para os alunos (opcional)"
    )


# ============================================================
# RESPOSTA DA GERAÇÃO
# ============================================================
class GenerateSimuladoResponse(BaseModel):
    """Resultado da geração de simulado do banco."""
    simulado_id: UUID
    title: str
    total_questoes: int
    credits_consumed: float
    questions: List[QuestionOut]
    instructions: Optional[str] = None
    show_gabarito: bool = True
    include_header: bool = True