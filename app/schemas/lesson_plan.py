from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class LessonPlanGenerate(BaseModel):
    plan_type: str  # 'neuroaula', 'aula_que_funciona', 'planejamento', 'coordenacao'
    title: str
    subject: Optional[str] = None
    grade: Optional[str] = None
    content: Optional[str] = None
    objective: Optional[str] = None

    # Campos específicos do NeuroAula / Aula que Funciona (compatibilidade)
    bncc_codigo: Optional[str] = None
    bncc_texto: Optional[str] = None
    duracao_minutos: Optional[int] = None
    tipo_aula: Optional[str] = None
    num_alunos: Optional[int] = None
    dificuldades: Optional[str] = None
    conhecimentos_previos: Optional[str] = None
    necessidades_especificas: Optional[str] = None

    # Campo para versão diferenciada
    diferenciado: Optional[bool] = False

    extra: Optional[Dict[str, Any]] = None

    # ============================================================
    # PLANEJADOR SIMIDNAPE — campos novos (Bloco D2)
    # Todos opcionais, para não quebrar chamadas antigas.
    # ============================================================
    # Modo de operação: "aula" (padrão), "planejamento", "coordenacao"
    modo: Optional[str] = "aula"

    # Período (para modo "planejamento")
    periodo_tipo: Optional[str] = None       # "aula" | "semana" | "mes" | "bimestre"
    periodo_inicio: Optional[str] = None     # "YYYY-MM-DD"
    periodo_fim: Optional[str] = None        # "YYYY-MM-DD"
    tempo_aula_minutos: Optional[int] = None # 50 ou 60
    aulas_por_dia: Optional[int] = None
    dias_por_semana: Optional[int] = None
    total_aulas: Optional[int] = None        # calculado pelo frontend ou pelo backend

    # Múltiplas habilidades + descritores + referenciais (como no Motor 9)
    habilidades: Optional[List[Dict[str, Any]]] = None
    descritores: Optional[List[str]] = None
    referenciais: Optional[List[str]] = None  # ["bncc", "saeb", "saepi", ...]

    # Modo "coordenacao"
    tipo_acao: Optional[str] = None           # "formacao", "acompanhamento", "intervencao", etc.
    publico_alvo: Optional[str] = None        # "professores do 5º ano", "toda a escola", etc.
    objetivo_pedagogico: Optional[str] = None

    # Privacidade no banco público
    mostrar_nome: Optional[bool] = True
    mostrar_escola: Optional[bool] = True
    mostrar_municipio: Optional[bool] = True
    mostrar_titulo: Optional[bool] = True

class LessonPlanOut(BaseModel):
    id: UUID
    user_id: UUID
    plan_type: str
    title: str
    subject: Optional[str]
    grade: Optional[str]
    content: Optional[str]
    objective: Optional[str]
    structured_data: Dict[str, Any]

    # Campos novos do Planejador SIMIDNAPE (Bloco D2)
    modo: Optional[str] = "aula"
    periodo_tipo: Optional[str] = None
    periodo_inicio: Optional[str] = None
    periodo_fim: Optional[str] = None
    total_aulas: Optional[int] = None
    publico: Optional[bool] = False

    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True