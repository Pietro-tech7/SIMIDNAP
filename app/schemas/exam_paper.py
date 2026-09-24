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

    

# ============================================================
# CRUD DE PROVAS (Bloco 3.2)
# ============================================================
class ExamPaperQuestionSnapshot(BaseModel):
    """Uma questão dentro de uma prova montada."""
    ordem: int = Field(..., ge=1)
    question_bank_id: Optional[UUID] = None
    snapshot: Dict[str, Any] = Field(
        ...,
        description="Cópia da questão no momento da montagem (enunciado, alternativas, gabarito, ícone)"
    )
    icone_svg: Optional[str] = None


class ExamPaperHeader(BaseModel):
    """Cabeçalho personalizado da prova."""
    escola: Optional[str] = None
    gre: Optional[str] = None
    rede: Optional[str] = None
    municipio: Optional[str] = None
    uf: Optional[str] = None
    turno: Optional[str] = None
    professor: Optional[str] = None
    turma: Optional[str] = None
    data: Optional[str] = None
    logo_prefeitura: Optional[str] = None  # data URL
    logo_escola: Optional[str] = None      # data URL


class ExamPaperCreate(BaseModel):
    """Payload para criar uma nova prova."""
    titulo: str = Field(..., max_length=200)
    modo: str = Field(..., description="'curado' | 'ia_gerada'")
    etapa: Optional[str] = None
    ano: Optional[int] = None
    serie: Optional[str] = None
    componente: Optional[str] = None
    disciplina_nome: Optional[str] = None
    cabecalho: Optional[ExamPaperHeader] = None
    questoes: List[ExamPaperQuestionSnapshot] = Field(default_factory=list)
    gabarito_incluido: bool = False


class ExamPaperUpdate(BaseModel):
    """Payload para atualizar uma prova existente."""
    titulo: Optional[str] = Field(None, max_length=200)
    cabecalho: Optional[ExamPaperHeader] = None
    questoes: Optional[List[ExamPaperQuestionSnapshot]] = None
    gabarito_incluido: Optional[bool] = None


class ExamPaperListItem(BaseModel):
    """Item resumido da lista de provas."""
    id: UUID
    titulo: str
    modo: str
    etapa: Optional[str] = None
    ano: Optional[int] = None
    serie: Optional[str] = None
    componente: Optional[str] = None
    disciplina_nome: Optional[str] = None
    num_questoes: int
    gabarito_incluido: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExamPaperOut(BaseModel):
    """Prova completa."""
    id: UUID
    user_id: UUID
    titulo: str
    modo: str
    etapa: Optional[str] = None
    ano: Optional[int] = None
    serie: Optional[str] = None
    componente: Optional[str] = None
    disciplina_nome: Optional[str] = None
    cabecalho: Optional[Dict[str, Any]] = None
    questoes: List[Dict[str, Any]] = Field(default_factory=list)
    num_questoes: int
    gabarito_incluido: bool
    enviado_para_curadoria: bool
    aprovado_pelo_admin: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExamPaperListResponse(BaseModel):
    """Lista paginada de provas."""
    items: List[ExamPaperListItem]
    total: int
    page: int
    per_page: int
    total_pages: int