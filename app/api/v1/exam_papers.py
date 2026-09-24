"""
Rotas do Motor 8 — Banco de Questões Curado.

Este router é independente do `/questions` (Motor 7). Adiciona filtros
estendidos e endpoints de estatística/habilidades, sem tocar em nada
que já existe.

Prefix: /question-bank
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import Optional, List
import math

from ...core.database import get_db
from ...models.user import User
from ...models.question_bank import QuestionBank
from ...core.security import decode_token
from ...schemas.exam_paper import (
    QuestionStats,
    StatsGroup,
    HabilidadeDisponivel,
    HabilidadesDisponiveisResponse,
    QuestionListItemExt,
    QuestionSearchExtResponse,
)

router = APIRouter(prefix="/question-bank", tags=["question-bank"])


# ============================================================
# AUTENTICAÇÃO (mesma lógica dos outros routers)
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
# HELPER — aplica filtros comuns
# ============================================================
def _aplicar_filtros(
    query,
    etapa: Optional[str],
    ano: Optional[int],
    serie: Optional[str],
    componente: Optional[str],
    referencial: Optional[str],
    habilidade_codigo: Optional[str],
    origem: Optional[str],
    busca: Optional[str],
    aprovadas_apenas: bool,
):
    if etapa:
        query = query.filter(QuestionBank.etapa == etapa)
    if ano:
        query = query.filter(QuestionBank.ano == ano)
    if serie:
        query = query.filter(QuestionBank.serie == serie)
    if componente:
        query = query.filter(QuestionBank.disciplina.ilike(f"%{componente}%"))
    if referencial:
        query = query.filter(QuestionBank.referencial == referencial)
    if habilidade_codigo:
        query = query.filter(QuestionBank.habilidade_codigo == habilidade_codigo)
    if origem:
        query = query.filter(QuestionBank.origem == origem)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(func.lower(QuestionBank.enunciado).like(termo))
    if aprovadas_apenas:
        query = query.filter(QuestionBank.approved == True)
    return query


# ============================================================
# 1) ESTATÍSTICAS
# ============================================================
@router.get("/stats", response_model=QuestionStats)
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estatísticas do banco de questões (contagens agregadas)."""
    base = db.query(QuestionBank).filter(QuestionBank.approved == True)

    total = base.count()

    def agrupar(campo):
        rows = (
            db.query(campo, func.count(QuestionBank.id))
            .filter(QuestionBank.approved == True)
            .filter(campo.isnot(None))
            .group_by(campo)
            .all()
        )
        return [StatsGroup(chave=str(r[0]), quantidade=r[1]) for r in rows if r[0]]

    return QuestionStats(
        total=total,
        por_componente=agrupar(QuestionBank.disciplina),
        por_ano=agrupar(QuestionBank.ano),
        por_etapa=agrupar(QuestionBank.etapa),
        por_referencial=agrupar(QuestionBank.referencial),
        por_origem=agrupar(QuestionBank.origem),
    )


# ============================================================
# 2) HABILIDADES DISPONÍVEIS
# ============================================================
@router.get("/habilidades-disponiveis", response_model=HabilidadesDisponiveisResponse)
def habilidades_disponiveis(
    etapa: Optional[str] = Query(None),
    componente: Optional[str] = Query(None),
    ano: Optional[int] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista habilidades (códigos) que possuem questões no banco.
    Útil para o professor filtrar por habilidade específica.
    """
    query = db.query(
        QuestionBank.habilidade_codigo,
        func.count(QuestionBank.id).label("qtd"),
        func.max(QuestionBank.referencial).label("ref"),
        func.max(QuestionBank.componente).label("comp"),
        func.max(QuestionBank.ano).label("ano_max"),
        func.max(QuestionBank.etapa).label("etapa_max"),
    ).filter(
        QuestionBank.approved == True,
        QuestionBank.habilidade_codigo.isnot(None),
    )

    if etapa:
        query = query.filter(QuestionBank.etapa == etapa)
    if ano:
        query = query.filter(QuestionBank.ano == ano)
    if componente:
        query = query.filter(QuestionBank.disciplina.ilike(f"%{componente}%"))

    query = query.group_by(QuestionBank.habilidade_codigo)

    rows = query.limit(limit).all()

    items = [
        HabilidadeDisponivel(
            codigo=r[0],
            texto=None,  # o texto é preenchido pelo frontend se necessário (via BNCC API)
            componente=r[3],
            ano=r[4],
            etapa=r[5],
            referencial=r[2],
            total_questoes=r[1],
        )
        for r in rows
    ]

    return HabilidadesDisponiveisResponse(items=items, total=len(items))


# ============================================================
# 3) BUSCA ESTENDIDA
# ============================================================
@router.get("/search", response_model=QuestionSearchExtResponse)
def search_extended(
    etapa: Optional[str] = Query(None),
    ano: Optional[int] = Query(None),
    serie: Optional[str] = Query(None),
    componente: Optional[str] = Query(None),
    referencial: Optional[str] = Query(None),
    habilidade_codigo: Optional[str] = Query(None),
    origem: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    aprovadas_apenas: bool = Query(True),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Busca questões com filtros estendidos (Motor 8).
    Retorna resultados paginados com preview do enunciado.
    """
    query = db.query(QuestionBank)
    query = _aplicar_filtros(
        query,
        etapa=etapa,
        ano=ano,
        serie=serie,
        componente=componente,
        referencial=referencial,
        habilidade_codigo=habilidade_codigo,
        origem=origem,
        busca=busca,
        aprovadas_apenas=aprovadas_apenas,
    )

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens_raw = (
        query.order_by(QuestionBank.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    itens: List[QuestionListItemExt] = []
    for q in itens_raw:
        enunciado = q.enunciado or ""
        preview = enunciado[:200].replace("\n", " ").strip()
        if len(enunciado) > 200:
            preview += "..."

        itens.append(QuestionListItemExt(
            id=q.id,
            fonte=q.fonte,
            ano=q.ano,
            etapa=q.etapa,
            serie=q.serie,
            componente=q.componente if hasattr(q, "componente") else None,
            disciplina=q.disciplina,
            habilidade_codigo=q.habilidade_codigo,
            referencial=q.referencial,
            origem=q.origem,
            tipo=q.tipo,
            numero=q.numero,
            preview=preview,
        ))

    return QuestionSearchExtResponse(
        items=itens,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )