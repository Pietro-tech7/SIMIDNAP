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
# 4.5) DESCRITORES (para o filtro do Motor 8)
# ============================================================
@router.get("/descritores")
def listar_descritores(
    componente: str = Query(..., description="MA, LP, CI, HI, GE"),
    ano: Optional[int] = Query(None),
    fonte: Optional[str] = Query(None, description="'saeb' | 'saepi'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista os descritores disponíveis para um componente/ano.
    Retorna: [{codigo, texto, tema, fonte, ano}, ...]
    """
    from ...models.descritor import Descritor

    query = db.query(Descritor).filter(
        Descritor.componente == componente,
        Descritor.ativo == True,
    )
    if ano is not None:
        query = query.filter(Descritor.ano == ano)
    if fonte:
        query = query.filter(Descritor.fonte == fonte)

    registros = query.order_by(Descritor.codigo).all()

    return {
        "componente": componente,
        "ano": ano,
        "total": len(registros),
        "descritores": [
            {
                "codigo": d.codigo,
                "texto": d.texto,
                "tema": d.tema,
                "fonte": d.fonte,
                "ano": d.ano,
            }
            for d in registros
        ],
    }

# ============================================================
# 4.7) HABILIDADE COMPLETA (complementos + descritores correlacionados)
# ============================================================
@router.get("/habilidade-completa/{codigo}")
def habilidade_completa(
    codigo: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna TODAS as informações de uma habilidade em uma única chamada:
      - Dados da BNCC (texto, unidade, objeto)
      - Complemento do Currículo do Piauí (se existir)
      - Descritores correlacionados (com texto completo)
    """
    from ...models.descritor import Descritor
    from ...models.habilidade_descritor import HabilidadeDescritor
    from ...models.curriculo_piaui_skill import CurriculoPiauiSkill

    # 1. Busca a habilidade na BNCC
    skill = (
        db.query(BnccEstrutura)
        .filter(BnccEstrutura.habilidade_codigo == codigo)
        .first()
    )
    if not skill:
        raise HTTPException(status_code=404, detail="Habilidade não encontrada.")

    # 2. Complementos do Piauí (se existirem)
    complementos_pi = []
    try:
        comps = (
            db.query(CurriculoPiauiSkill)
            .filter(CurriculoPiauiSkill.codigo_bncc == codigo)
            .all()
        )
        complementos_pi = [
            {
                "codigo": c.codigo,
                "texto": c.texto,
                "ordem": c.ordem,
            }
            for c in comps
        ]
    except Exception as e:
        print(f"[HabilidadeCompleta] Erro ao buscar complementos PI: {e}")

    # 3. Descritores correlacionados (com texto completo)
    descritores = []
    try:
        correlacoes = (
            db.query(HabilidadeDescritor)
            .filter(HabilidadeDescritor.habilidade_codigo == codigo)
            .all()
        )
        for c in correlacoes:
            desc = db.query(Descritor).filter(Descritor.id == c.descritor_id).first()
            if desc and desc.ativo:
                descritores.append({
                    "id": str(c.id),
                    "codigo": desc.codigo,
                    "texto": desc.texto,
                    "tema": desc.tema,
                    "fonte": desc.fonte,
                    "ano": desc.ano,
                    "confianca": c.confianca,
                    "revisado": c.revisado,
                })
        descritores.sort(key=lambda d: (d["fonte"], d["codigo"]))
    except Exception as e:
        print(f"[HabilidadeCompleta] Erro ao buscar descritores: {e}")

    return {
        "codigo": skill.habilidade_codigo,
        "texto": skill.habilidade_texto,
        "etapa": skill.etapa,
        "ano": skill.ano,
        "componente": skill.componente,
        "unidade_tematica": skill.unidade_tematica,
        "objeto_conhecimento": skill.objeto_conhecimento,
        "tem_descritor": skill.tem_descritor == "S",
        "complementos_pi": complementos_pi,
        "descritores": descritores,
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