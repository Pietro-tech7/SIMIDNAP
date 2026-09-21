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
    education_stage: Optional[str] = None,
    # Contexto escolar (professor)
    school: Optional[str] = None,
    city: Optional[str] = None,
    gre: Optional[str] = None,
    grade: Optional[str] = None,
    subject: Optional[str] = None,
    num_alunos: Optional[int] = None,
    class_profile: Optional[str] = None,
    itinerario: Optional[str] = None,
    # Contexto de gestão (coordenador)
    eixo_atuacao: Optional[str] = None,
    num_professores: Optional[int] = None,
    series_impactadas: Optional[str] = None,
    perfil_equipe: Optional[str] = None,
    dados_avaliacoes: Optional[Dict[str, Any]] = None,
    # Seminário
    seminar_theme: Optional[str] = None,
    # BNCC
    bncc_codigo: Optional[str] = None,
    bncc_texto: Optional[str] = None,
    # Particularidades da prática
    original_grade: Optional[str] = None,
    target_grade: Optional[str] = None,
    has_special_needs: bool = False,
    duration: Optional[str] = None,
    # Recursos
    resources: Optional[Dict[str, bool]] = None,
    resources_extra: Optional[str] = None,
    # Histórico e evidências
    already_tried: Optional[str] = None,
    evidences: Optional[str] = None,
    observed_results: Optional[str] = None,
    culminancia: Optional[str] = None,
    replicability: Optional[str] = None,
    # Relato guiado — fluxos A e B
    what_was_done: Optional[str] = None,
    how_it_went: Optional[str] = None,
    what_was_noticed: Optional[str] = None,
    school_context: Optional[str] = None,
    # Relato guiado — fluxo C
    goal: Optional[str] = None,
    what_you_imagine: Optional[str] = None,
    what_you_expect: Optional[str] = None,
    # Rede de segurança
    answers: Optional[Dict[str, Any]] = None,
) -> SuccessfulPractice:
    """
    Gera uma prática exitosa via IA e salva no banco.

    task_type usado na IA: 'pratica_exitosa'
    O payload carrega TODOS os dados (professor e coordenador),
    e a IA decide o que usar com base em perfil, fluxo e etapa de ensino.
    """
    ai = get_ai_service()

    answers = answers or {}
    resources = resources or {}
    dados_avaliacoes = dados_avaliacoes or {}

    # ============================================================
    # MONTA O PAYLOAD COMPLETO PARA A IA
    # ============================================================
    payload = {
        # Identificação e fluxo
        "title": title,
        "perfil": perfil,                      # 'professor' | 'coordenador'
        "flow_type": flow_type,                # 'ja_tenho' | 'criar'
        "sub_flow": sub_flow,                  # 'melhorar' | 'documento' | None
        "category": category,                  # 'educacao_infantil' | 'ciclo_alfabetizacao' | 'ensino_fundamental' | 'linguagens' | 'matematica' | 'ciencias_natureza' | 'ciencias_humanas' | 'gestao_escolar'
        "education_stage": education_stage,    # 'EI' | 'EF' | 'EM'

        # Contexto escolar (professor)
        "school": school,
        "city": city,
        "gre": gre,
        "grade": grade,
        "subject": subject,
        "num_alunos": num_alunos,
        "class_profile": class_profile,
        "itinerario": itinerario,              # EM apenas

        # Contexto de gestão (coordenador)
        "eixo_atuacao": eixo_atuacao,
        "num_professores": num_professores,
        "series_impactadas": series_impactadas,
        "perfil_equipe": perfil_equipe,

        # Dados de avaliações externas
        "dados_avaliacoes": dados_avaliacoes,

        # Seminário / evento
        "seminar_theme": seminar_theme,

        # BNCC
        "bncc_codigo": bncc_codigo,
        "bncc_texto": bncc_texto,

        # Particularidades
        "original_grade": original_grade,
        "target_grade": target_grade,
        "has_special_needs": has_special_needs,
        "duration": duration,

        # Recursos disponíveis
        "resources": resources,
        "resources_extra": resources_extra,

        # Histórico e evidências
        "already_tried": already_tried,
        "evidences": evidences,
        "observed_results": observed_results,
        "culminancia": culminancia,
        "replicability": replicability,

        # Relato guiado — fluxos A e B
        "what_was_done": what_was_done,
        "how_it_went": how_it_went,
        "what_was_noticed": what_was_noticed,
        "school_context": school_context,

        # Relato guiado — fluxo C
        "goal": goal,
        "what_you_imagine": what_you_imagine,
        "what_you_expect": what_you_expect,

        # Relato consolidado (compatibilidade)
        "description": description,

        # Rede de segurança
        "answers": answers,
    }

    # ============================================================
    # CHAMA A IA
    # ============================================================
    structured_data = ai.generate_structured(
        task_type="pratica_exitosa",
        payload=payload,
        diferenciado=False,
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
            "input": payload,
            "output": structured_data,
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