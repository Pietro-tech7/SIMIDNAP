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