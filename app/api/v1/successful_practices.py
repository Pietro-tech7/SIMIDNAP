from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from ...core.database import get_db
from ...models.user import User
from ...schemas.successful_practice import (
    SuccessfulPracticeGenerate,
    SuccessfulPracticeOut,
    SuccessfulPracticeListItem,
)
from ...services.successful_practice_service import (
    generate_practice,
    list_practices,
    get_practice,
    delete_practice,
)
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/successful-practices", tags=["successful-practices"])


# ============================================================
# AUTENTICAÇÃO (mesmo padrão do materials.py)
# ============================================================
def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido.")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


# ============================================================
# GERAR PRÁTICA EXITOSA
# ============================================================
@router.post("/generate", response_model=SuccessfulPracticeOut, status_code=201)
def generate(
    data: SuccessfulPracticeGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ---- Validações básicas ----
    perfis_validos = ("professor", "coordenador")
    if data.perfil not in perfis_validos:
        raise HTTPException(status_code=400, detail="Perfil inválido.")

    fluxos_validos = ("ja_tenho", "criar")
    if data.flow_type not in fluxos_validos:
        raise HTTPException(status_code=400, detail="Tipo de fluxo inválido.")

    if data.flow_type == "ja_tenho":
        subs_validos = ("melhorar", "documento")
        if data.sub_flow not in subs_validos:
            raise HTTPException(
                status_code=400,
                detail="Sub-fluxo obrigatório ('melhorar' ou 'documento') quando flow_type='ja_tenho'."
            )

    categorias_validas = ("educacao_infantil", "ciclo_alfabetizacao", "gestao_escolar")
    if data.category not in categorias_validas:
        raise HTTPException(status_code=400, detail="Categoria inválida.")

    # ---- Verifica créditos ANTES de gerar ----
    pode, custo = verificar_creditos(
        db,
        str(current_user.id),
        "pratica_exitosa",
        diferenciado=False,
    )
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    # ---- Gera via IA (todos os campos novos são passados) ----
    practice = generate_practice(
        db=db,
        user_id=str(current_user.id),
        # Identificação e fluxo
        title=data.title,
        perfil=data.perfil,
        flow_type=data.flow_type,
        category=data.category,
        sub_flow=data.sub_flow,
        # Contexto escolar
        school=data.school,
        city=data.city,
        gre=data.gre,
        grade=data.grade,
        subject=data.subject,
        num_alunos=data.num_alunos,
        class_profile=data.class_profile,
        # Seminário
        seminar_theme=data.seminar_theme,
        # BNCC
        bncc_codigo=data.bncc_codigo,
        bncc_texto=data.bncc_texto,
        # Particularidades
        original_grade=data.original_grade,
        target_grade=data.target_grade,
        has_special_needs=data.has_special_needs,
        duration=data.duration,
        # Recursos
        resources=data.resources,
        resources_extra=data.resources_extra,
        # Histórico e evidências
        already_tried=data.already_tried,
        evidences=data.evidences,
        observed_results=data.observed_results,
        culminancia=data.culminancia,
        replicability=data.replicability,
        # Relato guiado
        what_was_done=data.what_was_done,
        how_it_went=data.how_it_went,
        what_was_noticed=data.what_was_noticed,
        school_context=data.school_context,
        description=data.description,
        # Rede de segurança
        answers=data.answers,
    )

    # ---- Só consome créditos se gerou com sucesso ----
    consumir_creditos(db, str(current_user.id), "pratica_exitosa", custo)
    return practice


# ============================================================
# LISTAR PRÁTICAS
# ============================================================
@router.get("", response_model=List[SuccessfulPracticeListItem])
def list_all(
    flow_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_practices(db, str(current_user.id), flow_type, category)


# ============================================================
# BUSCAR UMA PRÁTICA
# ============================================================
@router.get("/{practice_id}", response_model=SuccessfulPracticeOut)
def get_one(
    practice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    practice = get_practice(db, str(current_user.id), practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Prática não encontrada.")
    return practice


# ============================================================
# DELETAR PRÁTICA
# ============================================================
@router.delete("/{practice_id}", status_code=204)
def remove(
    practice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    practice = delete_practice(db, str(current_user.id), practice_id)
    if not practice:
        raise HTTPException(status_code=404, detail="Prática não encontrada.")
    return None