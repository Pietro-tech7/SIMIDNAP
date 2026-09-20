from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from ..models.successful_practice import SuccessfulPractice
from .ai_service import get_ai_service


# ============================================================
# GERAÇÃO (chama a IA)
# ============================================================
def generate_practice(
    db: Session,
    user_id: str,
    title: str,
    perfil: str,
    flow_type: str,
    category: str,
    description: str,
    sub_flow: Optional[str] = None,
    school: Optional[str] = None,
    city: Optional[str] = None,
    gre: Optional[str] = None,
    grade: Optional[str] = None,
    subject: Optional[str] = None,
    original_grade: Optional[str] = None,
    target_grade: Optional[str] = None,
    has_special_needs: bool = False,
    duration: Optional[str] = None,
    num_alunos: Optional[int] = None,
    answers: Optional[Dict[str, Any]] = None,
) -> SuccessfulPractice:
    """
    Gera uma prática exitosa via IA e salva no banco.

    task_type usado na IA: 'pratica_exitosa'
    O prompt é montado dinamicamente com base em perfil, fluxo e sub_flow.
    """
    ai = get_ai_service()

    answers = answers or {}

    # ============================================================
    # MONTA O PAYLOAD COMPLETO PARA A IA
    # Aqui é onde a "mágica" acontece: o payload carrega TODO o
    # contexto necessário para o Gemini adaptar a resposta.
    # ============================================================
    payload = {
        # Identificação
        "title": title,
        "perfil": perfil,              # 'professor' | 'coordenador'
        "flow_type": flow_type,        # 'ja_tenho' | 'criar'
        "sub_flow": sub_flow,          # 'melhorar' | 'documento' | None
        "category": category,          # 'educacao_infantil' | 'ciclo_alfabetizacao' | 'gestao_escolar'

        # Contexto escolar
        "school": school,
        "city": city,
        "gre": gre,
        "grade": grade,
        "subject": subject,

        # Particularidades da prática
        "original_grade": original_grade,
        "target_grade": target_grade,
        "has_special_needs": has_special_needs,
        "duration": duration,
        "num_alunos": num_alunos,

        # Relato principal
        "description": description,

        # Todas as respostas do wizard (rede de segurança)
        "answers": answers,
    }

    # ============================================================
    # CHAMA A IA
    # ============================================================
    structured_data = ai.generate_structured(
        task_type="pratica_exitosa",
        payload=payload,
        diferenciado=False,   # Práticas Exitosas não usam "diferenciado"
    )

    # ============================================================
    # SALVA NO BANCO
    # ============================================================
    practice = SuccessfulPractice(
        user_id=user_id,
        title=title,
        perfil=perfil,
        flow_type=flow_type,
        sub_flow=sub_flow,
        category=category,
        school=school,
        city=city,
        gre=gre,
        grade=grade,
        subject=subject,
        original_grade=original_grade,
        target_grade=target_grade,
        has_special_needs=has_special_needs,
        duration=duration,
        num_alunos=num_alunos,
        description=description,
        structured_data={
            "input": payload,          # guarda tudo que foi enviado
            "output": structured_data, # guarda a resposta da IA
        },
    )
    db.add(practice)
    db.commit()
    db.refresh(practice)
    return practice


# ============================================================
# LISTAGEM
# ============================================================
def list_practices(
    db: Session,
    user_id: str,
    flow_type: Optional[str] = None,
    category: Optional[str] = None,
) -> List[SuccessfulPractice]:
    query = db.query(SuccessfulPractice).filter(
        SuccessfulPractice.user_id == user_id
    )
    if flow_type:
        query = query.filter(SuccessfulPractice.flow_type == flow_type)
    if category:
        query = query.filter(SuccessfulPractice.category == category)
    return query.order_by(SuccessfulPractice.created_at.desc()).all()


# ============================================================
# BUSCAR UMA
# ============================================================
def get_practice(
    db: Session,
    user_id: str,
    practice_id: str,
) -> Optional[SuccessfulPractice]:
    return (
        db.query(SuccessfulPractice)
        .filter(
            SuccessfulPractice.id == practice_id,
            SuccessfulPractice.user_id == user_id,
        )
        .first()
    )


# ============================================================
# DELETAR
# ============================================================
def delete_practice(
    db: Session,
    user_id: str,
    practice_id: str,
) -> Optional[SuccessfulPractice]:
    practice = get_practice(db, user_id, practice_id)
    if practice:
        db.delete(practice)
        db.commit()
    return practice