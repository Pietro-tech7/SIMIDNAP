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
    num_alunos: Optional[int] = None
    class_profile: Optional[str] = Field(
        None,
        description="Perfil da turma (ex: 'turma agitada', 'alunos com lacunas')"
    )

    # ------------------------------------------------------------
    # SEMINÁRIO / EVENTO
    # ------------------------------------------------------------
    seminar_theme: Optional[str] = Field(
        None,
        description="Tema do seminário ou evento em que a prática será apresentada"
    )

    # ------------------------------------------------------------
    # BNCC
    # ------------------------------------------------------------
    bncc_codigo: Optional[str] = Field(None, description="Código BNCC (ex: EF05MA03)")
    bncc_texto: Optional[str] = Field(None, description="Texto da habilidade BNCC")

    # ------------------------------------------------------------
    # DADOS ESPECÍFICOS DA PRÁTICA
    # ------------------------------------------------------------
    original_grade: Optional[str] = Field(
        None,
        description="Ano original da prática (ao reaplicar em outra turma)"
    )
    target_grade: Optional[str] = Field(
        None,
        description="Novo ano-alvo da prática (ao reaplicar em outra turma)"
    )
    has_special_needs: bool = Field(
        False,
        description="Se há alunos com laudo ou que precisam de atenção especial"
    )
    duration: Optional[str] = Field(
        None,
        description="Duração desejada (ex: 'um bimestre', 'o ano todo')"
    )

    # ------------------------------------------------------------
    # RECURSOS DISPONÍVEIS
    # ------------------------------------------------------------
    resources: Optional[Dict[str, bool]] = Field(
        default_factory=dict,
        description="Recursos disponíveis na escola (internet, projetor, impressora...)"
    )
    resources_extra: Optional[str] = Field(
        None,
        description="Materiais de consumo ou recursos extras"
    )

    # ------------------------------------------------------------
    # HISTÓRICO E EVIDÊNCIAS
    # ------------------------------------------------------------
    already_tried: Optional[str] = Field(
        None,
        description="O que o professor já tentou e não funcionou (sub_flow='melhorar')"
    )
    evidences: Optional[str] = Field(
        None,
        description="Evidências disponíveis (fotos, depoimentos, produções)"
    )
    observed_results: Optional[str] = Field(
        None,
        description="Resultados já observados pelo professor"
    )
    culminancia: Optional[str] = Field(
        None,
        description="Culminância desejada (apresentação, mostra, socialização)"
    )
    replicability: Optional[str] = Field(
        None,
        description="Potencial de replicabilidade em outras escolas"
    )

    # ------------------------------------------------------------
    # RELATO GUIADO (3-4 sub-etapas)
    # ------------------------------------------------------------
    description: str = Field(
        ...,
        description="Relato consolidado (concatenado das sub-etapas)"
    )
    what_was_done: Optional[str] = Field(
        None,
        description="Sub-etapa 1: O que você fez?"
    )
    how_it_went: Optional[str] = Field(
        None,
        description="Sub-etapa 2: Como foi?"
    )
    what_was_noticed: Optional[str] = Field(
        None,
        description="Sub-etapa 3: O que você percebeu?"
    )
    school_context: Optional[str] = Field(
        None,
        description="Sub-etapa 4: Contexto da escola (só 'documento')"
    )

    # ------------------------------------------------------------
    # RESPOSTAS COMPLETAS DO WIZARD (rede de segurança)
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