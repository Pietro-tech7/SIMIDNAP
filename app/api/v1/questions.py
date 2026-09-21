from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
import math

from ...core.database import get_db
from ...models.user import User
from ...models.question_bank import QuestionBank
from ...schemas.question_bank import (
    QuestionListItem,
    QuestionOut,
    QuestionSearchResponse,
    QuestionFilters,
    GenerateSimuladoFromBank,
    GenerateSimuladoResponse,
)
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/questions", tags=["questions"])


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
# FILTROS DISPONÍVEIS
# ============================================================
@router.get("/filters", response_model=QuestionFilters)
def get_filters(
    etapa: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna os filtros disponíveis (para montar os selects do frontend)."""
    query = db.query(QuestionBank)
    if etapa:
        query = query.filter(QuestionBank.etapa == etapa)

    fontes = [r[0] for r in query.with_entities(QuestionBank.fonte).distinct().all() if r[0]]
    anos = sorted(
        [r[0] for r in query.with_entities(QuestionBank.ano).distinct().all() if r[0]],
        reverse=True,
    )
    etapas = [r[0] for r in query.with_entities(QuestionBank.etapa).distinct().all() if r[0]]
    areas = [r[0] for r in query.with_entities(QuestionBank.area).distinct().all() if r[0]]
    disciplinas = sorted(
        [r[0] for r in query.with_entities(QuestionBank.disciplina).distinct().all() if r[0]]
    )

    return QuestionFilters(
        fontes=fontes,
        anos=anos,
        etapas=etapas,
        areas=areas,
        disciplinas=disciplinas,
    )


# ============================================================
# BUSCAR QUESTÕES
# ============================================================
@router.get("", response_model=QuestionSearchResponse)
def search_questions(
    fonte: Optional[str] = None,
    ano: Optional[int] = None,
    etapa: Optional[str] = None,
    area: Optional[str] = None,
    disciplina: Optional[str] = None,
    busca: Optional[str] = None,
    apenas_validas: bool = True,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Busca questões no banco com filtros.
    Retorna resultados paginados com preview do enunciado.
    """
    query = db.query(QuestionBank)

    if fonte:
        query = query.filter(QuestionBank.fonte == fonte)
    if ano:
        query = query.filter(QuestionBank.ano == ano)
    if etapa:
        query = query.filter(QuestionBank.etapa == etapa)
    if area:
        query = query.filter(QuestionBank.area == area)
    if disciplina:
        query = query.filter(QuestionBank.disciplina == disciplina)
    if apenas_validas:
        query = query.filter(QuestionBank.anulada == False)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(func.lower(QuestionBank.enunciado).like(termo))

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens_raw = (
        query.order_by(QuestionBank.ano.desc(), QuestionBank.numero.asc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    itens = []
    for q in itens_raw:
        preview = (q.enunciado or "")[:200].replace("\n", " ").strip()
        if len(q.enunciado or "") > 200:
            preview += "..."
        itens.append(QuestionListItem(
            id=q.id,
            fonte=q.fonte,
            ano=q.ano,
            etapa=q.etapa,
            area=q.area,
            disciplina=q.disciplina,
            numero=q.numero,
            tipo=q.tipo,
            preview=preview,
        ))

    return QuestionSearchResponse(
        items=itens,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# ============================================================
# BUSCAR UMA QUESTÃO COMPLETA
# ============================================================
@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna uma questão completa por ID."""
    q = db.query(QuestionBank).filter(QuestionBank.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    return QuestionOut(
        id=q.id,
        fonte=q.fonte,
        ano=q.ano,
        etapa=q.etapa,
        area=q.area,
        disciplina=q.disciplina,
        numero=q.numero,
        tipo=q.tipo,
        cor_caderno=q.cor_caderno,
        enunciado=q.enunciado,
        alternativas=q.alternativas,
        gabarito=q.gabarito,
        imagem_url=q.imagem_url,
        imagens_extras=q.imagens_extras,
        habilidades=q.habilidades,
        dificuldade=q.dificuldade,
        anulada=q.anulada,
        created_at=q.created_at,
    )


# ============================================================
# GERAR SIMULADO A PARTIR DO BANCO
# ============================================================
@router.post("/generate-simulado", response_model=GenerateSimuladoResponse, status_code=201)
def generate_simulado(
    data: GenerateSimuladoFromBank,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Gera um simulado a partir de questões selecionadas do banco.
    Custo: 1 crédito.
    """
    # Verifica créditos
    pode, custo = verificar_creditos(
        db,
        str(current_user.id),
        "simulado_banco",
        diferenciado=False,
    )
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    # Busca todas as questões de uma vez
    questoes = (
        db.query(QuestionBank)
        .filter(QuestionBank.id.in_(data.question_ids))
        .all()
    )

    if not questoes:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma questão encontrada com os IDs fornecidos."
        )

    # Ordena pela ordem dos IDs enviados
    mapa = {str(q.id): q for q in questoes}
    questoes_ordenadas = [mapa[str(qid)] for qid in data.question_ids if str(qid) in mapa]

    # Consome créditos
    consumir_creditos(db, str(current_user.id), "simulado_banco", custo)

    # Monta a resposta
    questions_out = [
        QuestionOut(
            id=q.id,
            fonte=q.fonte,
            ano=q.ano,
            etapa=q.etapa,
            area=q.area,
            disciplina=q.disciplina,
            numero=q.numero,
            tipo=q.tipo,
            cor_caderno=q.cor_caderno,
            enunciado=q.enunciado,
            alternativas=q.alternativas,
            gabarito=q.gabarito,
            imagem_url=q.imagem_url,
            imagens_extras=q.imagens_extras,
            habilidades=q.habilidades,
            dificuldade=q.dificuldade,
            anulada=q.anulada,
            created_at=q.created_at,
        )
        for q in questoes_ordenadas
    ]

    return GenerateSimuladoResponse(
        simulado_id=questoes_ordenadas[0].id,  # usa o primeiro ID como referência
        title=data.title,
        total_questoes=len(questoes_ordenadas),
        credits_consumed=custo / 10,
        questions=questions_out,
        instructions=data.instructions,
        show_gabarito=data.show_gabarito,
        include_header=data.include_header,
    )