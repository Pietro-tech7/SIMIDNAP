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
    

# ═══════════════════════════════════════════════════════════════
# CRIAÇÃO MANUAL DE QUESTÕES (Bloco 3.5.1)
# ═══════════════════════════════════════════════════════════════

@router.post("/question-bank/criar", response_model=AdminQuestionItem, status_code=201)
def admin_question_bank_criar(
    data: AdminQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Cria uma questão manualmente (admin). Já entra aprovada por padrão."""
    if data.etapa not in ("EI", "EF"):
        raise HTTPException(status_code=400, detail="Etapa deve ser 'EI' ou 'EF'.")
    if not data.enunciado or len(data.enunciado.strip()) < 10:
        raise HTTPException(status_code=400, detail="Enunciado muito curto (mínimo 10 caracteres).")

    nova = QuestionBankFundamental(
        id=uuid.uuid4() if 'uuid' in dir() else None,
        fonte="SIMIDNAPE_ADMIN",
        ano=data.ano,
        etapa=data.etapa,
        serie=data.serie,
        componente=data.componente,
        disciplina=data.disciplina or data.componente,
        numero=None,
        tipo=data.tipo,
        enunciado=data.enunciado.strip(),
        alternativas=data.alternativas,
        gabarito=data.gabarito,
        imagem_url=data.imagem_url,
        imagens_extras=data.imagens_extras,
        habilidades=[data.habilidade_codigo] if data.habilidade_codigo else None,
        habilidade_codigo=data.habilidade_codigo,
        referencial=data.referencial,
        descritores=data.descritores,
        dificuldade=data.dificuldade,
        origem="manual",
        submitted_by=current_user.id,
        approved=data.aprovada,
        approved_by=current_user.id if data.aprovada else None,
        approved_at=datetime.utcnow() if data.aprovada else None,
        anulada=False,
    )

    # Garante UUID se não foi gerado
    if nova.id is None:
        import uuid as _uuid
        nova.id = _uuid.uuid4()

    db.add(nova)
    db.commit()
    db.refresh(nova)
    return _montar_question_item(nova, db)