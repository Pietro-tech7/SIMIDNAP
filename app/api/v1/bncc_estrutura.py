"""
Endpoints para a estrutura curricular da BNCC.
Alimenta o fluxo em cascata:
  Componente → Unidade Temática → Objeto de Conhecimento → Habilidade
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any

from ...core.database import get_db
from ...models.user import User
from ...models.bncc_estrutura import BnccEstrutura
from ...core.security import decode_token

router = APIRouter(prefix="/bncc-estrutura", tags=["bncc-estrutura"])


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
# 1) UNIDADES TEMÁTICAS
# ============================================================
@router.get("/unidades-tematicas")
def listar_unidades(
    componente: str = Query(..., description="MA, LP, HI, ..."),
    ano: Optional[int] = Query(None, description="1 a 9 (None para EI)"),
    etapa: Optional[str] = Query(None, description="'EI' | 'EF'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna as unidades temáticas de um componente/ano.
    Ex: Matemática 2º ano → ['Números', 'Álgebra', 'Geometria', ...]
    """
    query = db.query(BnccEstrutura.unidade_tematica).filter(
        BnccEstrutura.componente == componente,
        BnccEstrutura.unidade_tematica.isnot(None),
        BnccEstrutura.unidade_tematica != "",
    )

    if etapa:
        query = query.filter(BnccEstrutura.etapa == etapa)
    if ano is not None:
        query = query.filter(BnccEstrutura.ano == ano)

    resultados = query.distinct().order_by(BnccEstrutura.unidade_tematica).all()

    return {
        "componente": componente,
        "ano": ano,
        "total": len(resultados),
        "unidades": [r[0] for r in resultados if r[0]],
    }


# ============================================================
# 2) OBJETOS DE CONHECIMENTO
# ============================================================
@router.get("/objetos-conhecimento")
def listar_objetos(
    componente: str = Query(...),
    unidade_tematica: str = Query(..., description="Nome da unidade (ex: 'Números')"),
    ano: Optional[int] = Query(None),
    etapa: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna os objetos de conhecimento de uma unidade temática.
    """
    query = db.query(BnccEstrutura.objeto_conhecimento).filter(
        BnccEstrutura.componente == componente,
        BnccEstrutura.unidade_tematica == unidade_tematica,
        BnccEstrutura.objeto_conhecimento.isnot(None),
        BnccEstrutura.objeto_conhecimento != "",
    )

    if etapa:
        query = query.filter(BnccEstrutura.etapa == etapa)
    if ano is not None:
        query = query.filter(BnccEstrutura.ano == ano)

    resultados = query.distinct().order_by(BnccEstrutura.objeto_conhecimento).all()

    return {
        "componente": componente,
        "unidade_tematica": unidade_tematica,
        "ano": ano,
        "total": len(resultados),
        "objetos": [r[0] for r in resultados if r[0]],
    }


# ============================================================
# 3) HABILIDADES
# ============================================================
@router.get("/habilidades")
def listar_habilidades(
    componente: str = Query(...),
    unidade_tematica: Optional[str] = Query(None),
    objeto_conhecimento: Optional[str] = Query(None),
    ano: Optional[int] = Query(None),
    etapa: Optional[str] = Query(None),
    busca: Optional[str] = Query(None, description="Busca por código ou texto"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna as habilidades filtradas pela estrutura curricular.
    """
    query = db.query(BnccEstrutura).filter(
        BnccEstrutura.componente == componente,
    )

    if unidade_tematica:
        query = query.filter(BnccEstrutura.unidade_tematica == unidade_tematica)
    if objeto_conhecimento:
        query = query.filter(BnccEstrutura.objeto_conhecimento == objeto_conhecimento)
    if ano is not None:
        query = query.filter(BnccEstrutura.ano == ano)
    if etapa:
        query = query.filter(BnccEstrutura.etapa == etapa)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(
            func.lower(BnccEstrutura.habilidade_codigo).like(termo)
            | func.lower(BnccEstrutura.habilidade_texto).like(termo)
        )

    registros = query.order_by(BnccEstrutura.habilidade_codigo).all()

    itens = [
        {
            "codigo": r.habilidade_codigo,
            "texto": r.habilidade_texto,
            "etapa": r.etapa,
            "ano": r.ano,
            "componente": r.componente,
            "unidade_tematica": r.unidade_tematica,
            "objeto_conhecimento": r.objeto_conhecimento,
            "tem_descritor": r.tem_descritor == "S",
            "descritores_relacionados": r.descritores_relacionados,
            "referencial": r.referencial,
            "complemento_pi": r.complemento_pi,
        }
        for r in registros
    ]

    return {
        "total": len(itens),
        "habilidades": itens,
    }


# ============================================================
# 4) ESTRUTURA COMPLETA (tudo de uma vez — para o cascata)
# ============================================================
@router.get("/estrutura-completa")
def estrutura_completa(
    componente: str = Query(...),
    ano: Optional[int] = Query(None),
    etapa: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna a árvore completa:
    [
      {
        "unidade_tematica": "Números",
        "objetos": [
          {
            "objeto_conhecimento": "Sistema de numeração decimal",
            "habilidades": [{codigo, texto, tem_descritor}, ...]
          },
          ...
        ]
      },
      ...
    ]
    """
    query = db.query(BnccEstrutura).filter(
        BnccEstrutura.componente == componente,
    )
    if ano is not None:
        query = query.filter(BnccEstrutura.ano == ano)
    if etapa:
        query = query.filter(BnccEstrutura.etapa == etapa)

    registros = query.order_by(
        BnccEstrutura.unidade_tematica,
        BnccEstrutura.objeto_conhecimento,
        BnccEstrutura.habilidade_codigo,
    ).all()

    arvore: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}

    for r in registros:
        uni = r.unidade_tematica or "Sem unidade"
        obj = r.objeto_conhecimento or "Sem objeto"
        arvore.setdefault(uni, {})
        arvore[uni].setdefault(obj, [])
        arvore[uni][obj].append({
            "codigo": r.habilidade_codigo,
            "texto": r.habilidade_texto,
            "tem_descritor": r.tem_descritor == "S",
            "descritores_relacionados": r.descritores_relacionados,
        })

    resultado = []
    for uni, objs in sorted(arvore.items()):
        objetos_lista = []
        for obj, habs in sorted(objs.items()):
            objetos_lista.append({
                "objeto_conhecimento": obj,
                "habilidades": habs,
            })
        resultado.append({
            "unidade_tematica": uni,
            "objetos": objetos_lista,
        })

    return {
        "componente": componente,
        "ano": ano,
        "etapa": etapa,
        "total_unidades": len(resultado),
        "estrutura": resultado,
    }


# ============================================================
# 5) ESTATÍSTICAS (para debug)
# ============================================================
@router.get("/stats")
def stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estatísticas da tabela bncc_estrutura."""
    total = db.query(BnccEstrutura).count()

    por_comp = (
        db.query(BnccEstrutura.componente, func.count(BnccEstrutura.id))
        .group_by(BnccEstrutura.componente)
        .order_by(BnccEstrutura.componente)
        .all()
    )

    com_descritor = db.query(BnccEstrutura).filter(BnccEstrutura.tem_descritor == "S").count()

    return {
        "total": total,
        "com_descritor": com_descritor,
        "sem_descritor": total - com_descritor,
        "por_componente": [{"componente": c, "quantidade": q} for c, q in por_comp],
    }