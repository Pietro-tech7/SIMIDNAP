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

    Adapta-se a:
    - 2 perfis: 'professor' | 'coordenador'
    - 3 fluxos: 'ja_tenho' (sub: melhorar/documento) | 'criar'
    - 3 etapas de ensino: 'EI' | 'EF' | 'EM'
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
        description="'educacao_infantil' | 'ciclo_alfabetizacao' | 'gestao_escolar'"
    )
    education_stage: Optional[str] = Field(
        None,
        description="Etapa de ensino: 'EI' (Infantil) | 'EF' (Fundamental) | 'EM' (Médio)"
    )

    # ============================================================
    # CONTEXTO ESCOLAR
    # ============================================================
    school: Optional[str] = None
    city: Optional[str] = None
    gre: Optional[str] = None
    grade: Optional[str] = Field(None, description="Série/ano/etapa (professor)")
    subject: Optional[str] = Field(None, description="Área/disciplina (professor)")
    num_alunos: Optional[int] = Field(None, description="Nº de alunos (professor)")
    class_profile: Optional[str] = Field(
        None,
        description="Perfil da turma (professor)"
    )

    # ============================================================
    # CONTEXTO DE GESTÃO (exclusivo coordenador)
    # ============================================================
    eixo_atuacao: Optional[str] = Field(
        None,
        description="Eixo do coordenador: 'formacao_continuada' | 'acompanhamento_pedagogico' | 'uso_de_dados' | 'engajamento_equipe' | 'relacao_escola_familia' | 'conselho_classe'"
    )
    num_professores: Optional[int] = Field(
        None,
        description="Nº de professores envolvidos (coordenador)"
    )
    series_impactadas: Optional[str] = Field(
        None,
        description="Séries/etapas impactadas (coordenador)"
    )
    perfil_equipe: Optional[str] = Field(
        None,
        description="Perfil da equipe docente (coordenador)"
    )

    # ============================================================
    # DADOS DE AVALIAÇÕES EXTERNAS (coordenador — foco SAEPI/IDEB)
    # ============================================================
    dados_avaliacoes: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="""
        Dados estruturados de avaliações:
        {
          'participa': ['saepi', 'saeb', 'interna', 'empresa', 'olimpiadas'],
          'resultados': [
            {'avaliacao': 'SAEPI', 'ano_serie': '5º ano', 'disciplina': 'LP',
             'resultado': 'Proficiência média 210', 'descritores_baixos': 'D01, D03'}
          ],
          'frequencia_analise': 'bimestral',
          'intervencoes_anteriores': ['formacao', 'reagrupamento']
        }
        """
    )

    # ============================================================
    # SEMINÁRIO / EVENTO
    # ============================================================
    seminar_theme: Optional[str] = Field(
        None,
        description="Tema do seminário ou evento (fluxo documento)"
    )

    # ============================================================
    # BNCC
    # ============================================================
    bncc_codigo: Optional[str] = Field(None, description="Código BNCC (ex: EF05MA03)")
    bncc_texto: Optional[str] = Field(None, description="Texto da habilidade BNCC")

    # ============================================================
    # DADOS ESPECÍFICOS DA PRÁTICA
    # ============================================================
    original_grade: Optional[str] = Field(
        None,
        description="Ano original da prática (ao reaplicar em outra turma)"
    )
    target_grade: Optional[str] = Field(
        None,
        description="Novo ano-alvo (ao reaplicar em outra turma)"
    )
    has_special_needs: bool = Field(
        False,
        description="Se há alunos com laudo ou atenção especial (professor)"
    )
    duration: Optional[str] = Field(
        None,
        description="Duração desejada: 'um dia' | 'uma semana' | 'um mês' | 'um bimestre' | 'um semestre' | 'o ano todo'"
    )

    # ============================================================
    # RECURSOS DISPONÍVEIS
    # ============================================================
    resources: Optional[Dict[str, bool]] = Field(
        default_factory=dict,
        description="Recursos: {'internet': bool, 'projetor': bool, 'impressora': bool, 'espaco_externo': bool, 'laboratorio': bool}"
    )
    resources_extra: Optional[str] = Field(
        None,
        description="Materiais de consumo ou recursos extras"
    )

    # ============================================================
    # HISTÓRICO E EVIDÊNCIAS
    # ============================================================
    already_tried: Optional[str] = Field(
        None,
        description="O que já tentou e não funcionou (fluxo melhorar)"
    )
    evidences: Optional[str] = Field(
        None,
        description="Evidências disponíveis (fluxo documento)"
    )
    observed_results: Optional[str] = Field(
        None,
        description="Resultados já observados (fluxos melhorar e documento)"
    )
    culminancia: Optional[str] = Field(
        None,
        description="Culminância desejada (fluxo documento)"
    )
    replicability: Optional[str] = Field(
        None,
        description="Potencial de replicabilidade (fluxos documento e criar)"
    )

    # ============================================================
    # RELATO GUIADO (adapta por fluxo)
    # ============================================================
    description: str = Field(
        ...,
        description="Relato consolidado (concatenado das sub-etapas)"
    )

    # --- Fluxos A e B (já tenho) ---
    what_was_done: Optional[str] = Field(
        None,
        description="[Fluxo A/B] O que você fez?"
    )
    how_it_went: Optional[str] = Field(
        None,
        description="[Fluxo A/B] Como foi?"
    )
    what_was_noticed: Optional[str] = Field(
        None,
        description="[Fluxo A/B] O que você percebeu?"
    )

    # --- Fluxo B (documento) ---
    school_context: Optional[str] = Field(
        None,
        description="[Fluxo B] Contexto da escola (comunidade, realidade)"
    )

    # --- Fluxo C (criar do zero) ---
    goal: Optional[str] = Field(
        None,
        description="[Fluxo C] Qual é o objetivo principal?"
    )
    what_you_imagine: Optional[str] = Field(
        None,
        description="[Fluxo C] O que você imagina fazer?"
    )
    what_you_expect: Optional[str] = Field(
        None,
        description="[Fluxo C] O que você espera alcançar?"
    )

    # ============================================================
    # RESPOSTAS COMPLETAS DO WIZARD (rede de segurança)
    # ============================================================
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