from sqlalchemy.orm import Session
from datetime import datetime
from ..models.lesson_plan import LessonPlan
from .ai_service import get_ai_service
from typing import Dict, Any


def generate_lesson_plan(
    db: Session,
    user_id: str,
    plan_type: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objective: str = None,
    bncc_codigo: str = None,
    bncc_texto: str = None,
    duracao_minutos: int = None,
    tipo_aula: str = None,
    num_alunos: int = None,
    dificuldades: str = None,
    conhecimentos_previos: str = None,
    necessidades_especificas: str = None,
    diferenciado: bool = False,
    extra: Dict[str, Any] = None,
    user=None,
) -> LessonPlan:

    ai = get_ai_service()

    payload = {
        "title": title,
        "subject": subject,
        "grade": grade,
        "content": content,
        "objective": objective,
        "bncc_codigo": bncc_codigo,
        "bncc_texto": bncc_texto,
        "duracao_minutos": duracao_minutos,
        "tipo_aula": tipo_aula,
        "num_alunos": num_alunos,
        "dificuldades": dificuldades,
        "conhecimentos_previos": conhecimentos_previos,
        "necessidades_especificas": necessidades_especificas,
    }
    if extra:
        payload.update(extra)

    structured_data = ai.generate_structured(
        task_type=plan_type,
        payload=payload,
        diferenciado=diferenciado,
        user=user,
    )

    # ============================================================
    # Metadados do Planejador SIMIDNAPE (Bloco D5).
    # Extrai modo, período e total de aulas do `extra` e salva na
    # tabela. Campos antigos continuam com o comportamento padrão.
    # ============================================================
    extra = extra or {}

    MODO_POR_PLAN_TYPE = {
        "neuroaula": "aula",
        "aula_que_funciona": "aula",
        "planejamento": "planejamento",
        "coordenacao": "coordenacao",
    }
    modo = extra.get("modo") or MODO_POR_PLAN_TYPE.get(plan_type, "aula")
    periodo_tipo = extra.get("periodo_tipo")
    total_aulas = extra.get("total_aulas")

    def _parse_data(valor):
        """Converte 'YYYY-MM-DD' em objeto date. Retorna None se inválido."""
        if not valor:
            return None
        try:
            return datetime.strptime(str(valor), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

    periodo_inicio = _parse_data(extra.get("periodo_inicio"))
    periodo_fim = _parse_data(extra.get("periodo_fim"))

    plan = LessonPlan(
        user_id=user_id,
        plan_type=plan_type,
        title=title,
        subject=subject,
        grade=grade,
        content=content,
        objective=objective,
        structured_data=structured_data,
        modo=modo,
        periodo_tipo=periodo_tipo,
        periodo_inicio=periodo_inicio,
        periodo_fim=periodo_fim,
        total_aulas=total_aulas,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def list_lesson_plans(db: Session, user_id: str, plan_type: str = None):
    query = db.query(LessonPlan).filter(LessonPlan.user_id == user_id)
    if plan_type:
        query = query.filter(LessonPlan.plan_type == plan_type)
    return query.order_by(LessonPlan.created_at.desc()).all()


def get_lesson_plan(db: Session, user_id: str, plan_id: str):
    return db.query(LessonPlan).filter(
        LessonPlan.id == plan_id,
        LessonPlan.user_id == user_id
    ).first()


def delete_lesson_plan(db: Session, user_id: str, plan_id: str):
    plan = get_lesson_plan(db, user_id, plan_id)
    if plan:
        db.delete(plan)
        db.commit()
    return plan


# ============================================================
# MODO PLANEJAMENTO — Geração em LOTES (Bloco D10-fix-3a)
# ============================================================
def generate_planejamento_lote(
    db: Session,
    user_id: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objetivo: str = None,
    batch_start: int = 1,
    batch_end: int = 4,
    total_aulas: int = 4,
    extra: Dict[str, Any] = None,
    diferenciado: bool = False,
    user=None,
) -> Dict[str, Any]:
    """
    Gera UM LOTE de aulas para o Modo Planejamento.
    NÃO salva no banco — devolve o JSON parcial para o frontend acumular.
    O salvamento é feito depois por `save_planejamento_completo`.
    """
    ai = get_ai_service()

    payload = {
        "title": title,
        "subject": subject,
        "grade": grade,
        "content": content,
        "objetivo": objetivo,
        # Cabeçalho — dados do professor e da escola (D9-REBUILD-3b)
        "nome_professor": (extra or {}).get("nome_professor"),
        "nome_escola": (extra or {}).get("nome_escola"),
        "municipio": (extra or {}).get("municipio"),
        "estado": (extra or {}).get("estado"),
        # Período
        "periodo_tipo": (extra or {}).get("periodo_tipo"),
        "tempo_aula_minutos": (extra or {}).get("tempo_aula_minutos"),
        "aulas_por_semana": (extra or {}).get("aulas_por_semana"),
        "total_aulas": total_aulas,
        # Currículo
        "habilidades": (extra or {}).get("habilidades"),
        "descritores": (extra or {}).get("descritores"),
        "referenciais": (extra or {}).get("referenciais"),
        "batch_start": batch_start,
        "batch_end": batch_end,
    }

    structured_data = ai.generate_structured_batch(
        task_type="planejamento",
        payload=payload,
        batch_start=batch_start,
        batch_end=batch_end,
        total_aulas=total_aulas,
        diferenciado=diferenciado,
        user=user,
    )
    return structured_data


def update_lesson_plan(
    db: Session,
    user_id: str,
    plan_id: str,
    title: str = None,
    objective: str = None,
    structured_data: Dict[str, Any] = None,
) -> LessonPlan:
    """Edita título, objetivo e/ou o conteúdo estruturado de um plano (Bloco D11b)."""
    plan = get_lesson_plan(db, user_id, plan_id)
    if not plan:
        return None
    if title is not None:
        plan.title = title
    if objective is not None:
        plan.objective = objective
    if structured_data is not None:
        plan.structured_data = structured_data
    db.commit()
    db.refresh(plan)
    return plan


def duplicate_lesson_plan(
    db: Session,
    user_id: str,
    plan_id: str,
) -> LessonPlan:
    """
    Duplica um plano. Cria uma cópia idêntica com id novo (Bloco D11).
    A cópia NÃO herda o `publico=True` — quem duplica decide depois
    se quer publicar de novo.
    """
    original = get_lesson_plan(db, user_id, plan_id)
    if not original:
        return None

    copia = LessonPlan(
        user_id=user_id,
        plan_type=original.plan_type,
        title=f"{original.title} (cópia)",
        subject=original.subject,
        grade=original.grade,
        content=original.content,
        objective=original.objective,
        structured_data=original.structured_data,
        modo=original.modo,
        periodo_tipo=original.periodo_tipo,
        periodo_inicio=original.periodo_inicio,
        periodo_fim=original.periodo_fim,
        total_aulas=original.total_aulas,
        publico=False,
    )
    db.add(copia)
    db.commit()
    db.refresh(copia)
    return copia


def save_planejamento_completo(
    db: Session,
    user_id: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objective: str = None,
    structured_data: Dict[str, Any] = None,
    extra: Dict[str, Any] = None,
) -> LessonPlan:
    """
    Salva no banco um planejamento COMPLETO já montado pelo frontend
    (após acumular todos os lotes). Não chama a IA.
    """
    extra = extra or {}

    MODO_POR_PLAN_TYPE = {
        "neuroaula": "aula",
        "aula_que_funciona": "aula",
        "planejamento": "planejamento",
        "coordenacao": "coordenacao",
    }
    plan_type = extra.get("plan_type", "planejamento")
    modo = extra.get("modo") or MODO_POR_PLAN_TYPE.get(plan_type, "planejamento")
    periodo_tipo = extra.get("periodo_tipo")
    total_aulas = extra.get("total_aulas")

    def _parse_data(valor):
        if not valor:
            return None
        try:
            return datetime.strptime(str(valor), "%Y-%m-%d").date()
        except (ValueError, TypeError):
            return None

    plan = LessonPlan(
        user_id=user_id,
        plan_type=plan_type,
        title=title,
        subject=subject,
        grade=grade,
        content=content,
        objective=objective,
        structured_data=structured_data or {},
        modo=modo,
        periodo_tipo=periodo_tipo,
        periodo_inicio=_parse_data(extra.get("periodo_inicio")),
        periodo_fim=_parse_data(extra.get("periodo_fim")),
        total_aulas=total_aulas,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan