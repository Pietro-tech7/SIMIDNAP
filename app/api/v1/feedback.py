from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from ...core.database import get_db
from ...models.user import User
from ...models.material import Material
from ...models.lesson_plan import LessonPlan
from ...models.reflection import Reflection
from ...models.pedagogical_case import PedagogicalCase
from ...models.successful_practice import SuccessfulPractice
from ...schemas.feedback import (
    FeedbackCreate,
    FeedbackOut,
    FeedbackAdminItem,
    FeedbackStats,
)
from ...core.security import decode_token

router = APIRouter(prefix="/feedback", tags=["feedback"])


# ============================================================
# AUTENTICAÇÃO
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


def get_current_superuser(authorization: str = Header(...), db: Session = Depends(get_db)):
    user = get_current_user(authorization, db)
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return user


# ============================================================
# MAPPING: content_type → modelo SQLAlchemy
# ============================================================
MODELOS = {
    "pratica_exitosa": SuccessfulPractice,
    "material": Material,
    "neuroaula": LessonPlan,
    "aula_que_funciona": LessonPlan,
    "reflection": Reflection,
    "pedagogical_case": PedagogicalCase,
}


def _buscar_conteudo(db: Session, content_type: str, content_id: str, user_id: Optional[str] = None):
    """
    Busca um conteúdo por tipo e ID.
    Se user_id for passado, garante que o conteúdo pertence ao usuário.
    """
    modelo = MODELOS.get(content_type)
    if not modelo:
        return None

    query = db.query(modelo).filter(modelo.id == content_id)

    # LessonPlan: validar plan_type
    if modelo is LessonPlan:
        query = query.filter(LessonPlan.plan_type == content_type)

    if user_id:
        query = query.filter(modelo.user_id == user_id)

    return query.first()


# ============================================================
# CRIAR / ATUALIZAR FEEDBACK
# ============================================================
@router.post("", response_model=FeedbackOut, status_code=201)
def create_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Salva o feedback do usuário dentro do `structured_data` do conteúdo.
    Sobrescreve feedback anterior se existir.
    """
    conteudo = _buscar_conteudo(
        db, data.content_type, str(data.content_id), str(current_user.id)
    )
    if not conteudo:
        raise HTTPException(
            status_code=404,
            detail="Conteúdo não encontrado ou não pertence a você."
        )

    # Pega o structured_data atual (garantindo que seja dict)
    sd = conteudo.structured_data or {}
    if not isinstance(sd, dict):
        sd = {}

    # Salva o feedback
    feedback_data = {
        "rating": data.rating,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    sd["feedback"] = feedback_data

    # Marca como modificado (SQLAlchemy detecta mudanças em JSONB)
    conteudo.structured_data = sd
    db.add(conteudo)
    db.commit()
    db.refresh(conteudo)

    return FeedbackOut(
        content_type=data.content_type,
        content_id=data.content_id,
        rating=data.rating,
        comment=data.comment,
        created_at=datetime.fromisoformat(feedback_data["created_at"]),
    )


# ============================================================
# LISTAR FEEDBACKS (admin)
# ============================================================
@router.get("/admin/list", response_model=List[FeedbackAdminItem])
def list_feedbacks(
    rating: Optional[str] = None,
    content_type: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Lista todos os feedbacks para o painel admin.
    Filtros opcionais: rating ('positive'|'partial'|'negative'), content_type.
    """
    itens: List[FeedbackAdminItem] = []

    # Buscar em todas as tabelas
    for tipo, modelo in MODELOS.items():
        # Pular duplicatas (neuroaula/aula_que_funciona usam LessonPlan)
        if tipo == "aula_que_funciona" and content_type not in (None, "aula_que_funciona"):
            continue

        query = db.query(modelo).filter(modelo.structured_data.isnot(None))

        # Filtrar por plan_type para LessonPlan
        if modelo is LessonPlan:
            query = query.filter(LessonPlan.plan_type == tipo)

        for conteudo in query.all():
            sd = conteudo.structured_data or {}
            if not isinstance(sd, dict):
                continue
            fb = sd.get("feedback")
            if not fb or not isinstance(fb, dict):
                continue

            # Aplicar filtros
            if rating and fb.get("rating") != rating:
                continue
            if content_type and tipo != content_type:
                continue

            # Buscar usuário
            user = db.query(User).filter(User.id == conteudo.user_id).first()
            if not user:
                continue

            try:
                created = datetime.fromisoformat(fb.get("created_at", ""))
            except (ValueError, TypeError):
                created = conteudo.created_at or datetime.now(timezone.utc)

            itens.append(FeedbackAdminItem(
                content_type=tipo,
                content_id=conteudo.id,
                content_title=conteudo.title or "(sem título)",
                rating=fb.get("rating", "partial"),
                comment=fb.get("comment"),
                created_at=created,
                user_id=user.id,
                user_name=user.full_name or "(sem nome)",
                user_email=user.email,
            ))

    # Ordenar por data (mais recente primeiro)
    itens.sort(key=lambda x: x.created_at, reverse=True)
    return itens[:limit]


# ============================================================
# ESTATÍSTICAS DE FEEDBACK (admin)
# ============================================================
@router.get("/admin/stats", response_model=FeedbackStats)
def feedback_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Estatísticas agregadas de todos os feedbacks."""
    total = 0
    positive = 0
    partial = 0
    negative = 0
    por_tipo: dict = {}

    for tipo, modelo in MODELOS.items():
        if tipo == "aula_que_funciona":
            continue  # evita duplicação (LessonPlan já conta neuroaula)

        query = db.query(modelo).filter(modelo.structured_data.isnot(None))
        if modelo is LessonPlan:
            query = query.filter(LessonPlan.plan_type == "neuroaula")

        for conteudo in query.all():
            sd = conteudo.structured_data or {}
            if not isinstance(sd, dict):
                continue
            fb = sd.get("feedback")
            if not fb or not isinstance(fb, dict):
                continue

            rating = fb.get("rating")
            total += 1
            por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

            if rating == "positive":
                positive += 1
            elif rating == "partial":
                partial += 1
            elif rating == "negative":
                negative += 1

    return FeedbackStats(
        total=total,
        positive=positive,
        partial=partial,
        negative=negative,
        por_tipo=por_tipo,
    )