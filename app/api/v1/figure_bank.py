"""
Rotas admin do Banco de Figuras (Bloco F).

Prefix: /admin/figure-bank
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query, UploadFile, File, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime as _dt
import math
import uuid

from ...core.database import get_db
from ...models.user import User
from ...models.figure_bank import FigureBank
from ...core.security import decode_token
from ...schemas.figure_bank import (
    FigureBankItem,
    FigureBankListResponse,
    FigureBankUpdate,
    FigureBankUploadItem,
    FigureBankUploadError,
    FigureBankUploadResponse,
    FigureBankBatchIds,
    FigureBankBatchCategorize,
    FigureBankClassifyResponse,
    FigureBankStats,
    FigureBankStatsItem,
)

router = APIRouter(prefix="/admin/figure-bank", tags=["admin-figure-bank"])


# ============================================================
# AUTENTICAÇÃO — apenas superuser
# ============================================================
def get_current_superuser(authorization: str = Header(...), db: Session = Depends(get_db)):
    """Só permite acesso se o usuário for superuser."""
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
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return user


# ============================================================
# CONFIGURAÇÃO
# ============================================================
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB por arquivo

TIPOS_PERMITIDOS = {
    "image/svg+xml": ".svg",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
}

CATEGORIAS_VALIDAS = {
    "quantidade",
    "ordem",
    "medida",
    "decomposicao",
    "sequencia",
    "comparacao",
    "objetos_escolares",
    "formas",
    "numeros",
    "nenhuma",
}


# ============================================================
# HELPERS
# ============================================================
def _normalizar_categorias(categorias_raw: Optional[List[str]]) -> List[str]:
    """Limpa, valida e deduplica as categorias."""
    if not categorias_raw:
        return ["nenhuma"]
    limpas = []
    for c in categorias_raw:
        c = (c or "").strip().lower()
        if c and c in CATEGORIAS_VALIDAS and c not in limpas:
            limpas.append(c)
    return limpas if limpas else ["nenhuma"]


def _categorias_do_item(figura: FigureBank) -> List[str]:
    """Retorna a lista de categorias do item (fallback para o campo legado)."""
    cats = figura.categorias
    if cats and isinstance(cats, list) and len(cats) > 0:
        return cats
    if figura.categoria:
        return [figura.categoria]
    return ["nenhuma"]


def _montar_item(figura: FigureBank, db: Session) -> FigureBankItem:
    nome_autor = None
    if figura.uploaded_by:
        autor = db.query(User).filter(User.id == figura.uploaded_by).first()
        if autor:
            nome_autor = autor.full_name or autor.email

    return FigureBankItem(
        id=figura.id,
        nome=figura.nome,
        categoria=figura.categoria,
        categorias=_categorias_do_item(figura),
        subcategoria=figura.subcategoria,
        keywords=figura.keywords or [],
        mime_type=figura.mime_type,
        file_size=figura.file_size,
        uploaded_by=figura.uploaded_by,
        uploaded_by_nome=nome_autor,
        aprovada=figura.aprovada,
        origem=figura.origem,
        created_at=figura.created_at,
        updated_at=figura.updated_at,
    )


def _limpar_nome_arquivo(filename: str) -> str:
    """Gera um nome curto para exibição (remove extensão)."""
    if not filename:
        return "figura"
    base = filename.rsplit(".", 1)[0]
    return base[:200] if base else "figura"


# ============================================================
# UPLOAD — aceita 1 ou várias figuras
# ============================================================
@router.post("/upload", response_model=FigureBankUploadResponse)
async def upload_figuras(
    files: List[UploadFile] = File(...),
    categorias: Optional[str] = Form(None),
    subcategoria: Optional[str] = Form(None),
    keywords: Optional[str] = Form(None),
    aprovada: Optional[str] = Form("false"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Faz upload de 1 ou várias figuras de uma vez.

    - categorias: string com vírgulas (ex: "quantidade,formas")
    - subcategoria: texto livre (opcional)
    - keywords: string separada por vírgula (ex: "carrinho,brinquedo,roda")
    - aprovada: "true" ou "false" (padrão false — revisar antes)
    """
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    cats_list = _normalizar_categorias(
        [c.strip() for c in categorias.split(",")] if categorias else []
    )

    kws_list = None
    if keywords:
        kws_list = [k.strip() for k in keywords.split(",") if k.strip()]

    aprovada_bool = str(aprovada).lower() == "true"

    itens_ok: List[FigureBankUploadItem] = []
    erros: List[FigureBankUploadError] = []

    for file in files:
        filename = file.filename or "sem_nome"
        try:
            conteudo = await file.read()

            if len(conteudo) == 0:
                raise ValueError("Arquivo vazio.")
            if len(conteudo) > MAX_SIZE_BYTES:
                tamanho_mb = len(conteudo) / (1024 * 1024)
                raise ValueError(f"Arquivo muito grande ({tamanho_mb:.1f} MB). Limite: 5 MB.")

            mime = file.content_type or "application/octet-stream"
            if mime not in TIPOS_PERMITIDOS:
                raise ValueError(
                    f"Tipo não permitido: '{mime}'. Use SVG, PNG, JPG ou WEBP."
                )

            nova = FigureBank(
                id=uuid.uuid4(),
                nome=_limpar_nome_arquivo(filename),
                categoria=cats_list[0],
                categorias=cats_list,
                subcategoria=subcategoria or None,
                keywords=kws_list,
                file_data=conteudo,
                mime_type=mime,
                file_size=len(conteudo),
                uploaded_by=current_user.id,
                aprovada=aprovada_bool,
                origem="manual",
            )
            db.add(nova)
            db.commit()
            db.refresh(nova)

            itens_ok.append(FigureBankUploadItem(
                id=nova.id,
                nome=nova.nome,
                categorias=cats_list,
                mime_type=nova.mime_type,
                file_size=nova.file_size or 0,
            ))

        except Exception as e:
            db.rollback()
            erros.append(FigureBankUploadError(
                filename=filename,
                motivo=str(e),
            ))

    return FigureBankUploadResponse(
        sucesso=True,
        total_enviado=len(files),
        total_sucesso=len(itens_ok),
        total_erro=len(erros),
        itens=itens_ok,
        erros=erros,
    )


# ============================================================
# IA VISION — CLASSIFICAR FIGURA
# ============================================================
@router.post("/classify", response_model=FigureBankClassifyResponse)
async def classify_figura(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Classifica uma imagem usando IA Vision (Gemini).
    NÃO salva — apenas devolve a sugestão para o admin confirmar/ajustar.

    Retorna: { nome, categorias, subcategoria, keywords }
    """
    if not file:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado.")

    try:
        conteudo = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {e}")

    if len(conteudo) == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")
    if len(conteudo) > MAX_SIZE_BYTES:
        tamanho_mb = len(conteudo) / (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"Arquivo muito grande ({tamanho_mb:.1f} MB). Limite: 5 MB.")

    mime = file.content_type or "application/octet-stream"
    if mime not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo não permitido: '{mime}'. Use SVG, PNG, JPG ou WEBP.",
        )

    # SVG não é suportado pelo Gemini Vision — usar PNG/JPG/WEBP
    if mime == "image/svg+xml":
        raise HTTPException(
            status_code=400,
            detail="SVG não é suportado pela IA Vision. Use PNG, JPG ou WEBP.",
        )

    try:
        from ...services.gemini_service import get_gemini_service
        service = get_gemini_service()
        sugestao = await service.classify_image(conteudo, mime)
        return FigureBankClassifyResponse(**sugestao)
    except Exception as e:
        print(f"[Classify] Erro ao classificar figura: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao classificar. Detalhe: {str(e)[:200]}",
        )


# ============================================================
# LISTAR com filtros e paginação
# ============================================================
@router.get("", response_model=FigureBankListResponse)
def listar_figuras(
    categoria: Optional[str] = Query(None, description="Filtra por UMA categoria"),
    subcategoria: Optional[str] = Query(None),
    aprovada: Optional[bool] = Query(None),
    busca: Optional[str] = Query(None, description="Busca por nome ou keyword"),
    page: int = Query(1, ge=1),
    per_page: int = Query(40, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Lista as figuras do banco com filtros opcionais."""
    query = db.query(FigureBank)

    if categoria:
        # Busca na lista JSONB de categorias OU no campo legado
        query = query.filter(
            or_(
                FigureBank.categorias.cast(func.text).ilike(f'%"{categoria}"%'),
                FigureBank.categoria == categoria,
            )
        )
    if subcategoria:
        query = query.filter(FigureBank.subcategoria == subcategoria)
    if aprovada is not None:
        query = query.filter(FigureBank.aprovada == aprovada)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(
            func.lower(FigureBank.nome).like(termo)
            | FigureBank.keywords.cast(func.text).ilike(termo)
        )

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens = (
        query.order_by(FigureBank.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return FigureBankListResponse(
        items=[_montar_item(f, db) for f in itens],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# ============================================================
# ESTATÍSTICAS (precisa vir ANTES de /{figura_id})
# ============================================================
@router.get("/stats/resumo", response_model=FigureBankStats)
def stats_figuras(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    total = db.query(FigureBank).count()
    aprovadas = db.query(FigureBank).filter(FigureBank.aprovada == True).count()
    pendentes = total - aprovadas

    # Conta por categoria considerando a lista JSONB (evita duplicar)
    por_categoria_dict = {}
    todas = db.query(FigureBank).all()
    for f in todas:
        for c in _categorias_do_item(f):
            por_categoria_dict[c] = por_categoria_dict.get(c, 0) + 1

    por_categoria = [
        FigureBankStatsItem(chave=k, quantidade=v)
        for k, v in sorted(por_categoria_dict.items())
    ]

    por_origem = []
    rows2 = (
        db.query(FigureBank.origem, func.count(FigureBank.id))
        .group_by(FigureBank.origem)
        .all()
    )
    for orig, qtd in rows2:
        por_origem.append(FigureBankStatsItem(chave=orig or "(sem)", quantidade=qtd))

    return FigureBankStats(
        total_figuras=total,
        total_aprovadas=aprovadas,
        total_pendentes=pendentes,
        por_categoria=por_categoria,
        por_origem=por_origem,
    )


# ============================================================
# AÇÕES EM LOTE (precisam vir ANTES de /{figura_id})
# ============================================================
@router.post("/batch/delete")
def batch_delete(
    data: FigureBankBatchIds,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Remove várias figuras de uma vez."""
    qs = db.query(FigureBank).filter(FigureBank.id.in_(data.ids)).all()
    total = 0
    for f in qs:
        db.delete(f)
        total += 1
    db.commit()
    return {"sucesso": True, "total_removido": total}


@router.post("/batch/approve")
def batch_approve(
    data: FigureBankBatchIds,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Aprova várias figuras de uma vez."""
    qs = db.query(FigureBank).filter(FigureBank.id.in_(data.ids)).all()
    total = 0
    agora = _dt.utcnow()
    for f in qs:
        f.aprovada = True
        f.updated_at = agora
        total += 1
    db.commit()
    return {"sucesso": True, "total_aprovado": total}


@router.post("/batch/unapprove")
def batch_unapprove(
    data: FigureBankBatchIds,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Desaprova várias figuras de uma vez (volta para pendentes)."""
    qs = db.query(FigureBank).filter(FigureBank.id.in_(data.ids)).all()
    total = 0
    agora = _dt.utcnow()
    for f in qs:
        f.aprovada = False
        f.updated_at = agora
        total += 1
    db.commit()
    return {"sucesso": True, "total_desaprovado": total}


@router.post("/batch/categorize")
def batch_categorize(
    data: FigureBankBatchCategorize,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Muda as categorias de várias figuras.
    - modo='substituir': troca por essas categorias
    - modo='adicionar': soma às categorias existentes (sem duplicar)
    """
    cats_novas = _normalizar_categorias(data.categorias)
    if not cats_novas:
        raise HTTPException(status_code=400, detail="Nenhuma categoria válida informada.")

    modo = (data.modo or "substituir").lower()
    if modo not in ("substituir", "adicionar"):
        raise HTTPException(status_code=400, detail="Modo inválido. Use 'substituir' ou 'adicionar'.")

    qs = db.query(FigureBank).filter(FigureBank.id.in_(data.ids)).all()
    total = 0
    agora = _dt.utcnow()
    for f in qs:
        if modo == "substituir":
            novas = list(cats_novas)
        else:  # adicionar
            atuais = _categorias_do_item(f)
            novas = list(atuais)
            for c in cats_novas:
                if c not in novas:
                    novas.append(c)
        f.categorias = novas
        f.categoria = novas[0] if novas else "nenhuma"
        f.updated_at = agora
        total += 1
    db.commit()
    return {"sucesso": True, "total_atualizado": total, "modo": modo}


# ============================================================
# DETALHE (metadados — sem bytes)
# ============================================================
@router.get("/{figura_id}", response_model=FigureBankItem)
def detalhe_figura(
    figura_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    figura = db.query(FigureBank).filter(FigureBank.id == figura_id).first()
    if not figura:
        raise HTTPException(status_code=404, detail="Figura não encontrada.")
    return _montar_item(figura, db)


# ============================================================
# IMAGEM (bytes) — para exibir no admin
# ============================================================
@router.get("/{figura_id}/image")
def imagem_figura(
    figura_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    figura = db.query(FigureBank).filter(FigureBank.id == figura_id).first()
    if not figura:
        raise HTTPException(status_code=404, detail="Figura não encontrada.")

    return Response(
        content=figura.file_data,
        media_type=figura.mime_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )


# ============================================================
# EDITAR metadados
# ============================================================
@router.patch("/{figura_id}", response_model=FigureBankItem)
def editar_figura(
    figura_id: str,
    data: FigureBankUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    figura = db.query(FigureBank).filter(FigureBank.id == figura_id).first()
    if not figura:
        raise HTTPException(status_code=404, detail="Figura não encontrada.")

    if data.nome is not None:
        figura.nome = data.nome
    if data.categorias is not None:
        novas = _normalizar_categorias(data.categorias)
        figura.categorias = novas
        figura.categoria = novas[0] if novas else "nenhuma"
    if data.subcategoria is not None:
        figura.subcategoria = data.subcategoria or None
    if data.keywords is not None:
        figura.keywords = data.keywords
    if data.aprovada is not None:
        figura.aprovada = data.aprovada

    figura.updated_at = _dt.utcnow()

    db.commit()
    db.refresh(figura)
    return _montar_item(figura, db)


# ============================================================
# DELETAR
# ============================================================
@router.delete("/{figura_id}", status_code=204)
def deletar_figura(
    figura_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    figura = db.query(FigureBank).filter(FigureBank.id == figura_id).first()
    if not figura:
        raise HTTPException(status_code=404, detail="Figura não encontrada.")
    db.delete(figura)
    db.commit()
    return None