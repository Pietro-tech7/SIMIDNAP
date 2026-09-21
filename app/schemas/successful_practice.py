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

    Adapta-se a:
    - 2 perfis: 'professor' | 'coordenador'
    - 3 fluxos: 'ja_tenho' (sub: melhorar/documento) | 'criar'
    - 3 etapas de ensino: 'EI' | 'EF' | 'EM'
    - 6+ categorias: educacao_infantil, ciclo_alfabetizacao, ensino_fundamental,
      linguagens, matematica, ciencias_natureza, ciencias_humanas, gestao_escolar
    """

    # ============================================================
    # IDENTIFICAÇÃO E FLUXO
    # ============================================================
    title: str = Field(..., description="Título provisório ou nome da prática")
    perfil: str = Field(..., description="'professor' ou 'coordenador'")
    flow_type: str = Field(..., description="'ja_tenho' ou 'criar'")
    sub_flow: Optional[str] = Field(
        None,
        description="'melhorar' ou 'documento' (só quando flow_type='ja_tenho')"
    )
    category: str = Field(
        ...,
        description=(
            "Categoria da prática. Valores possíveis:\n"
            "- EI: 'educacao_infantil' | 'gestao_escolar'\n"
            "- EF: 'ciclo_alfabetizacao' | 'ensino_fundamental' | 'gestao_escolar'\n"
            "- EM: 'linguagens' | 'matematica' | 'ciencias_natureza' | 'ciencias_humanas' | 'gestao_escolar'"
        )
    )
    education_stage: Optional[str] = Field(
        None,
        description="Etapa de ensino: 'EI' (Infantil) | 'EF' (Fundamental) | 'EM' (Médio)"
    )

    # ============================================================
    # CONTEXTO ESCOLAR (professor)
    # ============================================================
    school: Optional[str] = None
    city: Optional[str] = None
    gre: Optional[str] = None
    grade: Optional[str] = Field(
        None,
        description="Série/ano/etapa: 'Pré-escola II' (EI), '3º ano' (EF), '2ª série' (EM)"
    )
    subject: Optional[str] = Field(
        None,
        description="Disciplina (EF) ou componente específico (EM)"
    )
    num_alunos: Optional[int] = None
    class_profile: Optional[str] = Field(
        None,
        description="Perfil da turma (professor)"
    )
    itinerario: Optional[str] = Field(
        None,
        description="Itinerário formativo do EM: 'Projeto de Vida', 'Aprofundamento em...', 'Eletivas', etc"
    )

    # ============================================================
    # CONTEXTO DE GESTÃO (coordenador)
    # ============================================================
    eixo_atuacao: Optional[str] = Field(
        None,
        description="Eixo do coordenador: 'formacao_continuada' | 'acompanhamento_pedagogico' | 'uso_de_dados' | 'engajamento_equipe' | 'relacao_escola_familia' | 'conselho_classe'"
    )
    num_professores: Optional[int] = None
    series_impactadas: Optional[str] = None
    perfil_equipe: Optional[str] = None

    # ============================================================
    # DADOS DE AVALIAÇÕES EXTERNAS (coordenador)
    # ============================================================
    dados_avaliacoes: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="""
        {
          'participa': ['saepi', 'saeb', 'interna', 'empresa', 'olimpiadas'],
          'resultados': 'texto descritivo',
          'frequencia_analise': 'bimestral',
          'intervencoes_anteriores': ['formacao', 'reagrupamento']
        }
        """
    )

    # ============================================================
    # SEMINÁRIO
    # ============================================================
    seminar_theme: Optional[str] = None

    # ============================================================
    # BNCC
    # ============================================================
    bncc_codigo: Optional[str] = None
    bncc_texto: Optional[str] = None

    # ============================================================
    # PARTICULARIDADES
    # ============================================================
    original_grade: Optional[str] = None
    target_grade: Optional[str] = None
    has_special_needs: bool = False
    duration: Optional[str] = None

    # ============================================================
    # RECURSOS
    # ============================================================
    resources: Optional[Dict[str, bool]] = Field(
        default_factory=dict,
        description="{'internet': bool, 'projetor': bool, 'impressora': bool, 'espaco_externo': bool, 'laboratorio': bool}"
    )
    resources_extra: Optional[str] = None

    # ============================================================
    # HISTÓRICO E EVIDÊNCIAS
    # ============================================================
    already_tried: Optional[str] = None
    evidences: Optional[str] = None
    observed_results: Optional[str] = None
    culminancia: Optional[str] = None
    replicability: Optional[str] = None

    # ============================================================
    # RELATO GUIADO
    # ============================================================
    description: str = Field(..., description="Relato consolidado das sub-etapas")

    # Fluxos A e B
    what_was_done: Optional[str] = None
    how_it_went: Optional[str] = None
    what_was_noticed: Optional[str] = None
    school_context: Optional[str] = None

    # Fluxo C
    goal: Optional[str] = None
    what_you_imagine: Optional[str] = None
    what_you_expect: Optional[str] = None

    # ============================================================
    # REDE DE SEGURANÇA
    # ============================================================
    answers: Dict[str, Any] = Field(default_factory=dict)


# ============================================================
# SAÍDA
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
# LISTAGEM
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