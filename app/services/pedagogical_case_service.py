from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from ..models.pedagogical_case import PedagogicalCase
from .ai_service import get_ai_service


def create_case(
    db: Session,
    user_id: str,
    title: str,
    description: str,
    grade: str = None,
    subject: str = None,
    frequencia: str = None,
    situacoes: str = None,
    reacao_aluno: str = None,
    ja_tentou: str = None,
    contexto_adicional: str = None,
) -> PedagogicalCase:
    case = PedagogicalCase(
        user_id=user_id,
        title=title,
        description=description,
        grade=grade,
        subject=subject,
        frequencia=frequencia,
        situacoes=situacoes,
        reacao_aluno=reacao_aluno,
        ja_tentou=ja_tentou,
        contexto_adicional=contexto_adicional,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def list_cases(db: Session, user_id: str) -> List[PedagogicalCase]:
    return db.query(PedagogicalCase).filter(
        PedagogicalCase.user_id == user_id
    ).order_by(PedagogicalCase.created_at.desc()).all()


def get_case(db: Session, user_id: str, case_id: str) -> Optional[PedagogicalCase]:
    return db.query(PedagogicalCase).filter(
        PedagogicalCase.id == case_id,
        PedagogicalCase.user_id == user_id,
    ).first()


def update_case(db: Session, user_id: str, case_id: str, data: Dict[str, Any]) -> Optional[PedagogicalCase]:
    case = get_case(db, user_id, case_id)
    if not case:
        return None
    for key, value in data.items():
        if value is not None and hasattr(case, key):
            setattr(case, key, value)
    db.commit()
    db.refresh(case)
    return case


def delete_case(db: Session, user_id: str, case_id: str) -> Optional[PedagogicalCase]:
    case = get_case(db, user_id, case_id)
    if case:
        db.delete(case)
        db.commit()
    return case


def _montar_payload(case: PedagogicalCase) -> Dict[str, Any]:
    """Monta o payload para a IA com TODAS as informações disponíveis."""
    payload = {
        "title": case.title,
        "grade": case.grade or "",
        "subject": case.subject or "",
        "description": case.description,
    }

    # Adiciona campos de investigação apenas se estiverem preenchidos
    if case.frequencia:
        payload["frequencia"] = case.frequencia
    if case.situacoes:
        payload["situacoes"] = case.situacoes
    if case.reacao_aluno:
        payload["reacao_aluno"] = case.reacao_aluno
    if case.ja_tentou:
        payload["ja_tentou"] = case.ja_tentou
    if case.contexto_adicional:
        payload["contexto_adicional"] = case.contexto_adicional

    return payload


def analyze_case(db: Session, user_id: str, case_id: str) -> Dict[str, Any]:
    """
    Analisa a situação pedagógica com IA e retorna
    compreensão, hipóteses, intervenções, acompanhamento e encaminhamento.
    """
    case = get_case(db, user_id, case_id)
    if not case:
        return {"erro": "Situação não encontrada."}

    payload = _montar_payload(case)

    ai = get_ai_service()
    try:
        resultado = ai.generate_structured(
            task_type="situacao_pedagogica",
            payload=payload,
        )

        # Salva a análise no banco
        case.analysis = resultado
        db.commit()
        db.refresh(case)

        return resultado
    except Exception as e:
        print(f"[pedagogical_case_service] Erro ao analisar: {e}")
        return {"erro": f"Não foi possível analisar a situação: {str(e)}"}