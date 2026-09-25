"""
Rotas do Motor 8 — Banco de Questões Fundamental (Curado).

Este router é INDEPENDENTE do `/questions` (Motor 7 — ENEM).
Usa a tabela `question_bank_fundamental`, exclusiva para EI + EF.

Prefix: /question-bank
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
import math

from ...core.database import get_db
from ...models.user import User
from ...models.question_bank_fundamental import QuestionBankFundamental
from ...models.exam_paper import ExamPaper
from ...core.security import decode_token
from ...schemas.exam_paper import (
    QuestionStats,
    StatsGroup,
    HabilidadeDisponivel,
    HabilidadesDisponiveisResponse,
    QuestionListItemExt,
    QuestionSearchExtResponse,
    ExamPaperCreate,
    ExamPaperUpdate,
    ExamPaperOut,
    ExamPaperListItem,
    ExamPaperListResponse,
)

router = APIRouter(prefix="/question-bank", tags=["question-bank"])


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
    dificuldade: Optional[str],
    busca: Optional[str],
    aprovadas_apenas: bool,
    unidade_tematica: Optional[str] = None,
    objeto_conhecimento: Optional[str] = None,
    descritor: Optional[str] = None,
):
    if etapa:
        query = query.filter(QuestionBankFundamental.etapa == etapa)
    if ano:
        query = query.filter(QuestionBankFundamental.ano == ano)
    if serie:
        query = query.filter(QuestionBankFundamental.serie == serie)
    if componente:
        query = query.filter(QuestionBankFundamental.componente == componente)
    if unidade_tematica:
        query = query.filter(QuestionBankFundamental.unidade_tematica == unidade_tematica)
    if objeto_conhecimento:
        query = query.filter(QuestionBankFundamental.objeto_conhecimento == objeto_conhecimento)
    if referencial:
        query = query.filter(QuestionBankFundamental.referencial == referencial)
    if habilidade_codigo:
        query = query.filter(QuestionBankFundamental.habilidade_codigo == habilidade_codigo)
    if descritor:
        query = query.filter(QuestionBankFundamental.descritores.contains([descritor]))
    if origem:
        query = query.filter(QuestionBankFundamental.origem == origem)
    if dificuldade:
        query = query.filter(QuestionBankFundamental.dificuldade == dificuldade)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(func.lower(QuestionBankFundamental.enunciado).like(termo))
    if aprovadas_apenas:
        query = query.filter(QuestionBankFundamental.approved == True)
    return query


# ============================================================
# 1) ESTATÍSTICAS
# ============================================================
@router.get("/stats", response_model=QuestionStats)
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estatísticas do banco de questões (Motor 8)."""
    base = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.approved == True,
        QuestionBankFundamental.anulada == False,
    )
    total = base.count()

    def agrupar(campo):
        rows = (
            db.query(campo, func.count(QuestionBankFundamental.id))
            .filter(QuestionBankFundamental.approved == True)
            .filter(campo.isnot(None))
            .group_by(campo)
            .all()
        )
        return [StatsGroup(chave=str(r[0]), quantidade=r[1]) for r in rows if r[0]]

    return QuestionStats(
        total=total,
        por_componente=agrupar(QuestionBankFundamental.componente),
        por_ano=agrupar(QuestionBankFundamental.ano),
        por_etapa=agrupar(QuestionBankFundamental.etapa),
        por_referencial=agrupar(QuestionBankFundamental.referencial),
        por_origem=agrupar(QuestionBankFundamental.origem),
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
    """Lista habilidades (códigos) que possuem questões no banco (Motor 8)."""
    query = db.query(
        QuestionBankFundamental.habilidade_codigo,
        func.count(QuestionBankFundamental.id).label("qtd"),
        func.max(QuestionBankFundamental.referencial).label("ref"),
        func.max(QuestionBankFundamental.componente).label("comp"),
        func.max(QuestionBankFundamental.ano).label("ano_max"),
        func.max(QuestionBankFundamental.etapa).label("etapa_max"),
    ).filter(
        QuestionBankFundamental.approved == True,
        QuestionBankFundamental.anulada == False,
        QuestionBankFundamental.habilidade_codigo.isnot(None),
    )

    if etapa:
        query = query.filter(QuestionBankFundamental.etapa == etapa)
    if ano:
        query = query.filter(QuestionBankFundamental.ano == ano)
    if componente:
        query = query.filter(QuestionBankFundamental.componente == componente)

    query = query.group_by(QuestionBankFundamental.habilidade_codigo)
    rows = query.limit(limit).all()

    items = [
        HabilidadeDisponivel(
            codigo=r[0],
            texto=None,
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
    dificuldade: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    aprovadas_apenas: bool = Query(True),
    unidade_tematica: Optional[str] = Query(None),
    objeto_conhecimento: Optional[str] = Query(None),
    descritor: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Busca questões com filtros (Motor 8)."""
    query = db.query(QuestionBankFundamental)
    query = _aplicar_filtros(
        query,
        etapa=etapa,
        ano=ano,
        serie=serie,
        componente=componente,
        referencial=referencial,
        habilidade_codigo=habilidade_codigo,
        origem=origem,
        dificuldade=dificuldade,
        busca=busca,
        aprovadas_apenas=aprovadas_apenas,
        unidade_tematica=unidade_tematica,
        objeto_conhecimento=objeto_conhecimento,
        descritor=descritor,
    )
    # ... o resto da função (contagem, paginação, etc.) permanece igual

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens_raw = (
        query.order_by(QuestionBankFundamental.created_at.desc())
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
            fonte=q.fonte or "",
            ano=q.ano,
            etapa=q.etapa,
            serie=q.serie,
            componente=q.componente,
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


# ============================================================
# CRUD DE PROVAS
# ============================================================
@router.post("/exam-papers", response_model=ExamPaperOut, status_code=201)
def criar_prova(
    data: ExamPaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.modo not in ("curado", "ia_gerada"):
        raise HTTPException(status_code=400, detail="Modo deve ser 'curado' ou 'ia_gerada'.")

    questoes_dict = [q.model_dump(mode="json") for q in data.questoes]

    prova = ExamPaper(
        user_id=current_user.id,
        titulo=data.titulo,
        modo=data.modo,
        etapa=data.etapa,
        ano=data.ano,
        serie=data.serie,
        componente=data.componente,
        disciplina_nome=data.disciplina_nome,
        cabecalho=data.cabecalho.model_dump(exclude_none=True) if data.cabecalho else None,
        questoes=questoes_dict,
        num_questoes=len(questoes_dict),
        gabarito_incluido=data.gabarito_incluido,
    )
    db.add(prova)
    db.commit()
    db.refresh(prova)
    return prova


@router.get("/exam-papers", response_model=ExamPaperListResponse)
def listar_provas(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    modo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ExamPaper).filter(ExamPaper.user_id == current_user.id)
    if modo:
        query = query.filter(ExamPaper.modo == modo)

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens = (
        query.order_by(ExamPaper.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return ExamPaperListResponse(
        items=[ExamPaperListItem.model_validate(p) for p in itens],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/exam-papers/{paper_id}", response_model=ExamPaperOut)
def obter_prova(
    paper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prova = (
        db.query(ExamPaper)
        .filter(ExamPaper.id == paper_id, ExamPaper.user_id == current_user.id)
        .first()
    )
    if not prova:
        raise HTTPException(status_code=404, detail="Prova não encontrada.")
    return prova


@router.put("/exam-papers/{paper_id}", response_model=ExamPaperOut)
def atualizar_prova(
    paper_id: str,
    data: ExamPaperUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prova = (
        db.query(ExamPaper)
        .filter(ExamPaper.id == paper_id, ExamPaper.user_id == current_user.id)
        .first()
    )
    if not prova:
        raise HTTPException(status_code=404, detail="Prova não encontrada.")

    if data.titulo is not None:
        prova.titulo = data.titulo
    if data.cabecalho is not None:
        prova.cabecalho = data.cabecalho.model_dump(exclude_none=True)
    if data.questoes is not None:
        questoes_dict = [q.model_dump(mode="json") for q in data.questoes]
        prova.questoes = questoes_dict
        prova.num_questoes = len(questoes_dict)
    if data.gabarito_incluido is not None:
        prova.gabarito_incluido = data.gabarito_incluido

    db.commit()
    db.refresh(prova)
    return prova


@router.delete("/exam-papers/{paper_id}", status_code=204)
def excluir_prova(
    paper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prova = (
        db.query(ExamPaper)
        .filter(ExamPaper.id == paper_id, ExamPaper.user_id == current_user.id)
        .first()
    )
    if not prova:
        raise HTTPException(status_code=404, detail="Prova não encontrada.")
    db.delete(prova)
    db.commit()
    return None