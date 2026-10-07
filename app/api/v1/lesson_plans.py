from fastapi import APIRouter, Depends, HTTPException, Header, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.user import User
from ...schemas.lesson_plan import (
    LessonPlanGenerate,
    LessonPlanOut,
    LessonPlanGenerateBatch,
    LessonPlanSaveComplete,
    LessonPlanUpdate,
    LessonPlanPublish,
)
from ...services.lesson_plan_service import (
    generate_lesson_plan,
    list_lesson_plans,
    get_lesson_plan,
    delete_lesson_plan,
    generate_planejamento_lote,
    save_planejamento_completo,
    update_lesson_plan,
    duplicate_lesson_plan,
    publish_lesson_plan,
    list_public_plans,
    count_facetas_publicas,
    get_public_plan,
    increment_views,
)
from ...services.bncc_service import obter_habilidade
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/lesson-plans", tags=["lesson-plans"])


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


@router.post("/generate", response_model=LessonPlanOut, status_code=201)
def generate(
    data: LessonPlanGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Modos suportados pelo Planejador SIMIDNAPE
    MODOS_VALIDOS = ("neuroaula", "aula_que_funciona", "planejamento", "coordenacao")
    if data.plan_type not in MODOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Tipo de plano inválido.")

    # Para os modos novos, o custo em créditos é o mesmo do "aula_que_funciona"
    # (1 crédito; 2 se diferenciado). Assim não precisamos alterar a tabela de
    # custos existente. Quando quisermos cobrar diferente, mudamos só aqui.
    plan_type_credito = (
        "aula_que_funciona"
        if data.plan_type in ("planejamento", "coordenacao")
        else data.plan_type
    )

    # Verifica créditos ANTES de gerar (considerando diferenciado)
    diferenciado = data.diferenciado or False
    pode, custo = verificar_creditos(
        db,
        str(current_user.id),
        plan_type_credito,
        diferenciado=diferenciado,
    )
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    bncc_texto = data.bncc_texto
    if data.bncc_codigo and not bncc_texto:
        habilidade = obter_habilidade(data.bncc_codigo)
        if habilidade and habilidade.get("texto"):
            bncc_texto = habilidade["texto"]

    # ============================================================
    # Monta o `extra` com os campos do Planejador SIMIDNAPE (Bloco D5).
    # O service mescla tudo isso no payload que vai para a IA
    # e usa os metadados (modo, período, total de aulas) para salvar
    # na tabela lesson_plans.
    # ============================================================
    extra_completo = {**(data.extra or {})}
    if data.modo is not None:                extra_completo["modo"] = data.modo
    if data.periodo_tipo is not None:        extra_completo["periodo_tipo"] = data.periodo_tipo
    if data.periodo_inicio is not None:      extra_completo["periodo_inicio"] = data.periodo_inicio
    if data.periodo_fim is not None:         extra_completo["periodo_fim"] = data.periodo_fim
    if data.tempo_aula_minutos is not None:  extra_completo["tempo_aula_minutos"] = data.tempo_aula_minutos
    if data.aulas_por_dia is not None:       extra_completo["aulas_por_dia"] = data.aulas_por_dia
    if data.dias_por_semana is not None:     extra_completo["dias_por_semana"] = data.dias_por_semana
    if data.total_aulas is not None:         extra_completo["total_aulas"] = data.total_aulas
    if data.habilidades is not None:         extra_completo["habilidades"] = data.habilidades
    if data.descritores is not None:         extra_completo["descritores"] = data.descritores
    if data.referenciais is not None:        extra_completo["referenciais"] = data.referenciais
    if data.tipo_acao is not None:           extra_completo["tipo_acao"] = data.tipo_acao
    if data.publico_alvo is not None:        extra_completo["publico_alvo"] = data.publico_alvo
    if data.objetivo_pedagogico is not None: extra_completo["objetivo_pedagogico"] = data.objetivo_pedagogico
    if data.mostrar_nome is not None:        extra_completo["mostrar_nome"] = data.mostrar_nome
    if data.mostrar_escola is not None:      extra_completo["mostrar_escola"] = data.mostrar_escola
    if data.mostrar_municipio is not None:   extra_completo["mostrar_municipio"] = data.mostrar_municipio
    if data.mostrar_titulo is not None:      extra_completo["mostrar_titulo"] = data.mostrar_titulo

    plan = generate_lesson_plan(
        db=db,
        user_id=str(current_user.id),
        plan_type=data.plan_type,
        title=data.title,
        subject=data.subject,
        grade=data.grade,
        content=data.content,
        objective=data.objective,
        bncc_codigo=data.bncc_codigo,
        bncc_texto=bncc_texto,
        duracao_minutos=data.duracao_minutos,
        tipo_aula=data.tipo_aula,
        num_alunos=data.num_alunos,
        dificuldades=data.dificuldades,
        conhecimentos_previos=data.conhecimentos_previos,
        necessidades_especificas=data.necessidades_especificas,
        diferenciado=diferenciado,
        extra=extra_completo if extra_completo else None,
        user=current_user,
    )

    # Só consome créditos se gerou com sucesso
    consumir_creditos(db, str(current_user.id), plan_type_credito, custo)
    return plan


@router.get("", response_model=List[LessonPlanOut])
def list_all(
    plan_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_lesson_plans(db, str(current_user.id), plan_type)


# ============================================================
# GERAÇÃO EM LOTES — Modo Planejamento (Bloco D10-fix-3b)
# Mesmo padrão do Motor 9: o frontend faz requests sequenciais,
# cada um com uma duração curta (< 60s), evitando o timeout do Railway.
# ============================================================
@router.post("/generate-batch")
def generate_batch(
    data: LessonPlanGenerateBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Só aceita modo planejamento nesta rota
    if data.plan_type != "planejamento":
        raise HTTPException(
            status_code=400,
            detail="Geração em lotes só é suportada para o Modo Planejamento.",
        )

    total_aulas = data.total_aulas or data.batch_end
    batch_start = data.batch_start
    batch_end = min(data.batch_end, total_aulas)

    if batch_start < 1 or batch_end < batch_start:
        raise HTTPException(status_code=400, detail="Intervalo de lote inválido.")

    # Verifica créditos APENAS no primeiro lote (igual ao Motor 9)
    is_primeiro_lote = (batch_start == 1)
    custo = 0
    if is_primeiro_lote:
        pode, custo = verificar_creditos(
            db,
            str(current_user.id),
            "aula_que_funciona",
            diferenciado=data.diferenciado or False,
        )
        if not pode:
            raise HTTPException(
                status_code=402,
                detail="Créditos insuficientes. Faça upgrade do seu plano para continuar.",
            )

    # Monta o extra com todos os campos do Planejador SIMIDNAPE
    extra_completo = {**(data.extra or {})}
    if data.modo is not None:                extra_completo["modo"] = data.modo
    if data.periodo_tipo is not None:        extra_completo["periodo_tipo"] = data.periodo_tipo
    if data.periodo_inicio is not None:      extra_completo["periodo_inicio"] = data.periodo_inicio
    if data.periodo_fim is not None:         extra_completo["periodo_fim"] = data.periodo_fim
    if data.tempo_aula_minutos is not None:  extra_completo["tempo_aula_minutos"] = data.tempo_aula_minutos
    if data.aulas_por_dia is not None:       extra_completo["aulas_por_dia"] = data.aulas_por_dia
    if data.dias_por_semana is not None:     extra_completo["dias_por_semana"] = data.dias_por_semana
    if data.total_aulas is not None:         extra_completo["total_aulas"] = data.total_aulas
    if data.habilidades is not None:         extra_completo["habilidades"] = data.habilidades
    if data.descritores is not None:         extra_completo["descritores"] = data.descritores
    if data.referenciais is not None:        extra_completo["referenciais"] = data.referenciais

    structured_data = generate_planejamento_lote(
        db=db,
        user_id=str(current_user.id),
        title=data.title,
        subject=data.subject,
        grade=data.grade,
        content=data.content,
        objetivo=data.objective,
        batch_start=batch_start,
        batch_end=batch_end,
        total_aulas=total_aulas,
        extra=extra_completo,
        diferenciado=data.diferenciado or False,
        user=current_user,
    )

    if isinstance(structured_data, dict) and structured_data.get("erro"):
        raise HTTPException(status_code=500, detail=structured_data["erro"])

    # Consome créditos apenas no primeiro lote
    if is_primeiro_lote:
        consumir_creditos(db, str(current_user.id), "aula_que_funciona", custo)

    return {
        "structured_data": structured_data,
        "batch_start": batch_start,
        "batch_end": batch_end,
        "total_aulas": total_aulas,
        "is_primeiro_lote": is_primeiro_lote,
    }


@router.post("/save-complete", response_model=LessonPlanOut, status_code=201)
def save_complete(
    data: LessonPlanSaveComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Salva no banco um planejamento JÁ MONTADO pelo frontend.
    Não chama a IA e não consome créditos (a cobrança foi feita no primeiro lote).
    """
    plan = save_planejamento_completo(
        db=db,
        user_id=str(current_user.id),
        title=data.title,
        subject=data.subject,
        grade=data.grade,
        content=data.content,
        objective=data.objective,
        structured_data=data.structured_data,
        extra=data.extra or {},
    )
    return plan


# ============================================================
# MEUS PLANEJAMENTOS — Editar e Duplicar (Bloco D11)
# ============================================================
@router.patch("/{plan_id}", response_model=LessonPlanOut)
def update_one(
    plan_id: str,
    data: LessonPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edita título e/ou objetivo de um plano do usuário."""
    plan = update_lesson_plan(
        db=db,
        user_id=str(current_user.id),
        plan_id=plan_id,
        title=data.title,
        objective=data.objective,
        structured_data=data.structured_data,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return plan


@router.post("/{plan_id}/duplicate", response_model=LessonPlanOut, status_code=201)
def duplicate_one(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cria uma cópia do plano. A cópia NÃO é pública."""
    nova = duplicate_lesson_plan(
        db=db,
        user_id=str(current_user.id),
        plan_id=plan_id,
    )
    if not nova:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return nova


# ============================================================
# COMUNIDADE DE PLANEJAMENTOS SIMIDNAPE — Rotas públicas (D12c)
# ATENÇÃO: estas rotas DEVEM vir antes do GET /{plan_id},
# senão o FastAPI trata "public" como um plan_id e devolve 404.
# ============================================================

@router.get("/public/facetas")
def facetas_publicas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Contadores por faceta (modo, etapa, componente, tipo de ação)."""
    return count_facetas_publicas(db)


@router.get("/public")
def listar_publicos(
    modo: str = None,
    etapa: str = None,
    ano: int = None,
    componente: str = None,
    periodo_tipo: str = None,
    tipo_acao: str = None,
    busca: str = None,
    ordem: str = "recentes",
    limit: int = 60,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista planos do banco público.
    Filtros opcionais — todos combináveis.
    """
    return list_public_plans(
        db=db,
        modo=modo,
        etapa=etapa,
        ano=ano,
        componente=componente,
        periodo_tipo=periodo_tipo,
        tipo_acao=tipo_acao,
        busca=busca,
        ordem=ordem,
        limit=min(limit, 100),
        offset=offset,
    )


@router.get("/public/{plan_id}")
def obter_publico(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna um plano público específico e incrementa views."""
    plan = get_public_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano público não encontrado.")

    # Incrementa views
    increment_views(db, plan_id)

    # Re-busca para pegar o valor atualizado
    plan = get_public_plan(db, plan_id)

    return {
        "id": str(plan.id),
        "titulo": plan.title,
        "modo": plan.modo,
        "subject": plan.subject,
        "grade": plan.grade,
        "periodo_tipo": plan.periodo_tipo,
        "total_aulas": plan.total_aulas,
        "tipo_acao": plan.tipo_acao,
        "autor_nome": plan.autor_nome,
        "autor_escola": plan.autor_escola,
        "autor_municipio": plan.autor_municipio,
        "publicado_em": plan.publicado_em.isoformat() if plan.publicado_em else None,
        "views": plan.views or 0,
        "structured_data": plan.structured_data,
    }


# ============================================================
# COMUNIDADE — Publicar / Despublicar (D12c)
# ============================================================

@router.post("/{plan_id}/publish", response_model=LessonPlanOut)
def publicar_plano(
    plan_id: str,
    data: LessonPlanPublish,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Publica um plano no banco público.
    É idempotente — pode chamar várias vezes, não duplica.
    O usuário escolhe o que aparece como identificação do autor.
    """
    plan = publish_lesson_plan(
        db=db,
        user_id=str(current_user.id),
        plan_id=plan_id,
        mostrar_nome=data.mostrar_nome,
        mostrar_escola=data.mostrar_escola,
        mostrar_municipio=data.mostrar_municipio,
        mostrar_titulo=data.mostrar_titulo,
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return plan


@router.post("/{plan_id}/unpublish", response_model=LessonPlanOut)
def despublicar_plano(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove um plano do banco público. O plano continua em 'Meus Planejamentos'."""
    plan = get_lesson_plan(db, str(current_user.id), plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")

    plan.publico = False
    plan.publicado_em = None
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/{plan_id}", response_model=LessonPlanOut)
def get_one(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = get_lesson_plan(db, str(current_user.id), plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return plan


@router.delete("/{plan_id}", status_code=204)
def remove(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = delete_lesson_plan(db, str(current_user.id), plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return None


# ============================================================
# PLANO COM ROTEIRO — geração a partir de esboço
# Aceita texto colado E/OU até 10 arquivos (foto, PDF, DOCX)
# ============================================================
MAX_PAGINAS = 10
MAX_TAMANHO_MB = 10
MIMES_ACEITOS = {
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
EXTENSOES_ACEITAS = (".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx")


def _mime_aceito(fname: str, mime: str) -> bool:
    """Verifica se o arquivo tem mime ou extensão aceitos."""
    mime = (mime or "").lower().strip()
    fname = (fname or "").lower().strip()
    if mime in MIMES_ACEITOS:
        return True
    if fname.endswith(EXTENSOES_ACEITAS):
        return True
    return False


@router.post("/generate-from-sketch", response_model=LessonPlanOut, status_code=201)
def generate_from_sketch(
    texto: Optional[str] = Form(None),
    etapa: str = Form(...),
    ano: Optional[str] = Form(None),
    serie: Optional[str] = Form(None),
    referenciais: Optional[str] = Form(None),
    paginas: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Gera um plano pedagógico completo a partir de um esboço.

    Entrada (multipart/form-data):
      - texto: string (opcional)
      - etapa: "EI" | "EF" | "EM" (obrigatório)
      - ano: string (opcional)
      - serie: string (opcional)
      - referenciais: string JSON (opcional, ex: '["BNCC","SAEPI"]')
      - paginas: até 10 arquivos (jpg/png/webp/pdf/docx), 10 MB cada

    Retorna: LessonPlanOut (o plano salvo em lesson_plans).
    """
    import json as _json

    # ---------- Validações ----------
    etapa_norm = (etapa or "").strip().upper()
    if etapa_norm not in ("EI", "EF", "EM"):
        raise HTTPException(
            status_code=400,
            detail="Etapa inválida. Use 'EI', 'EF' ou 'EM'.",
        )

    lista_paginas = list(paginas or [])

    if not (texto and texto.strip()) and not lista_paginas:
        raise HTTPException(
            status_code=400,
            detail="Envie um texto ou pelo menos um arquivo.",
        )

    if len(lista_paginas) > MAX_PAGINAS:
        raise HTTPException(
            status_code=400,
            detail=f"Máximo de {MAX_PAGINAS} arquivos por geração.",
        )

    # Parse dos referenciais (vem como string JSON no multipart)
    refs: List[str] = ["BNCC"]
    if referenciais:
        try:
            refs_parsed = _json.loads(referenciais)
            if isinstance(refs_parsed, list) and refs_parsed:
                refs = [str(r) for r in refs_parsed if r]
        except Exception:
            pass

    # ---------- Verificar créditos ----------
    # Usa a mesma tabela de custo do "aula_que_funciona"
    # (o multimodal consome 2x — feito logo abaixo)
    pode, custo_base = verificar_creditos(
        db,
        str(current_user.id),
        "aula_que_funciona",
        diferenciado=False,
    )
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar.",
        )

    custo_total = custo_base * 2  # 2 créditos (multimodal)

    # ---------- Ler os arquivos em bytes ----------
    arquivos_bytes: List[dict] = []
    for arq in lista_paginas:
        try:
            conteudo = arq.file.read()
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Erro ao ler arquivo '{arq.filename}': {e}",
            )

        if not conteudo:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo '{arq.filename}' está vazio.",
            )

        if len(conteudo) > MAX_TAMANHO_MB * 1024 * 1024:
            mb = len(conteudo) / (1024 * 1024)
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Arquivo '{arq.filename}' tem {mb:.1f} MB. "
                    f"Máximo: {MAX_TAMANHO_MB} MB por arquivo."
                ),
            )

        if not _mime_aceito(arq.filename, arq.content_type):
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Formato de '{arq.filename}' não aceito. "
                    f"Use JPG, PNG, WEBP, PDF ou DOCX."
                ),
            )

        arquivos_bytes.append({
            "filename": arq.filename or "arquivo",
            "mime_type": arq.content_type or "",
            "data": conteudo,
        })

    # ---------- Chama o service ----------
    try:
        plan = generate_plano_from_sketch(
            db=db,
            user_id=str(current_user.id),
            texto=texto,
            etapa=etapa_norm,
            ano=ano,
            serie=serie,
            referenciais=refs,
            arquivos=arquivos_bytes,
            user=current_user,
        )
    except Exception as e:
        print(f"[Plano Completo] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar o plano: {str(e)[:200]}",
        )

    # ---------- Consome créditos ----------
    consumir_creditos(db, str(current_user.id), "aula_que_funciona", custo_total)

    return plan