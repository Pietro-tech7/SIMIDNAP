from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


# ============================================================
# ENTRADA — O que o frontend envia
# ============================================================
class SuccessfulPracticeGenerate(BaseModel):
    """
    Payload do wizard de Práticas Exitosas.
    O frontend monta este objeto com as respostas do professor/coordenador.
    """

    # ------------------------------------------------------------
    # IDENTIFICAÇÃO E FLUXO
    # ------------------------------------------------------------
    title: str = Field(..., description="Título provisório ou nome da prática")
    perfil: str = Field(..., description="'professor' ou 'coordenador'")
    flow_type: str = Field(..., description="'ja_tenho' ou 'criar'")
    sub_flow: Optional[str] = Field(
        None,
        description="'melhorar' ou 'documento' (só quando flow_type='ja_tenho')"
    )
    category: str = Field(
        ...,
        description="'educacao_infantil' | 'ciclo_alfabetizacao' | 'gestao_escolar'"
    )

    # ------------------------------------------------------------
    # CONTEXTO ESCOLAR
    # ------------------------------------------------------------
    school: Optional[str] = None
    city: Optional[str] = None
    gre: Optional[str] = None
    grade: Optional[str] = Field(None, description="Série/ano/etapa atual")
    subject: Optional[str] = Field(None, description="Área do conhecimento")

    # ------------------------------------------------------------
    # DADOS ESPECÍFICOS DA PRÁTICA
    # ------------------------------------------------------------
    original_grade: Optional[str] = Field(
        None,
        description="Ano original da prática (quando o professor vai reaplicar em outra turma)"
    )
    target_grade: Optional[str] = Field(
        None,
        description="Novo ano-alvo da prática (quando o professor vai reaplicar em outra turma)"
    )
    has_special_needs: bool = Field(
        False,
        description="Se há alunos com laudo ou que precisam de atenção especial"
    )
    duration: Optional[str] = Field(
        None,
        description="Duração desejada (ex: 'um bimestre', 'o ano todo')"
    )
    num_alunos: Optional[int] = None

    # ------------------------------------------------------------
    # RELATO PRINCIPAL
    # ------------------------------------------------------------
    description: str = Field(
        ...,
        description="Relato da prática (se já existe) OU objetivo/ideia (se vai criar)"
    )

    # ------------------------------------------------------------
    # RESPOSTAS COMPLETAS DO WIZARD
    # Guarda tudo em JSONB para flexibilidade futura
    # ------------------------------------------------------------
    answers: Dict[str, Any] = Field(
        default_factory=dict,
        description="Todas as respostas do wizard, chave-valor"
    )


# ============================================================
# SAÍDA — O que a API devolve
# ============================================================
class SuccessfulPracticeOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    perfil: str
    flow_type: str
    sub_flow: Optional[str]
    category: str
    school: Optional[str]
    city: Optional[str]
    gre: Optional[str]
    grade: Optional[str]
    subject: Optional[str]
    original_grade: Optional[str]
    target_grade: Optional[str]
    has_special_needs: bool
    duration: Optional[str]
    num_alunos: Optional[int]
    description: str
    structured_data: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================
# LISTAGEM (leve, sem structured_data)
# ============================================================
class SuccessfulPracticeListItem(BaseModel):
    id: UUID
    title: str
    perfil: str
    flow_type: str
    category: str
    grade: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True