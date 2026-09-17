from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..models.material import Material
from .ai_service import get_ai_service
from .inclusion_service import gerar_adaptacoes_inclusivas


def generate_material(
    db: Session,
    user_id: str,
    material_type: str,
    title: str,
    subject: str = None,
    grade: str = None,
    content: str = None,
    objective: str = None,
    bncc_codigo: str = None,
    bncc_texto: str = None,
    num_questoes: int = None,
    duracao_minutos: int = None,
    num_alunos: int = None,
    dificuldades: str = None,
    diferenciado: bool = False,
) -> Material:

    ai = get_ai_service()

    payload = {
        "title": title,
        "subject": subject,
        "grade": grade,
        "content": content,
        "objective": objective,
        "bncc_codigo": bncc_codigo,
        "bncc_texto": bncc_texto,
        "num_questoes": num_questoes,
        "duracao_minutos": duracao_minutos,
        "num_alunos": num_alunos,
        "dificuldades": dificuldades,
    }

    structured_data = ai.generate_structured(
        task_type=material_type,
        payload=payload,
        diferenciado=diferenciado,
    )

    # Garante que adaptações inclusivas estejam presentes
    if isinstance(structured_data, dict) and "inclusao" not in structured_data:
        structured_data["inclusao"] = gerar_adaptacoes_inclusivas(dificuldades or "")

    material = Material(
        user_id=user_id,
        material_type=material_type,
        title=title,
        subject=subject,
        grade=grade,
        content=content,
        diferenciado=diferenciado,
        structured_data=structured_data,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def list_materials(db: Session, user_id: str, material_type: str = None):
    query = db.query(Material).filter(Material.user_id == user_id)
    if material_type:
        query = query.filter(Material.material_type == material_type)
    return query.order_by(Material.created_at.desc()).all()


def get_material(db: Session, user_id: str, material_id: str):
    return db.query(Material).filter(
        Material.id == material_id,
        Material.user_id == user_id
    ).first()


def delete_material(db: Session, user_id: str, material_id: str):
    material = get_material(db, user_id, material_id)
    if material:
        db.delete(material)
        db.commit()
    return material