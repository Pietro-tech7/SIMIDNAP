from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import math
import uuid

from ...core.database import get_db
from ...models.user import User
from ...models.subscription import Subscription, UsageLog
from ...models.lesson_plan import LessonPlan
from ...models.reflection import Reflection
from ...models.material import Material
from ...models.pedagogical_case import PedagogicalCase
from ...models.successful_practice import SuccessfulPractice
from ...models.question_bank_fundamental import QuestionBankFundamental
from ...schemas.admin import (
    AdminUserOut,
    AdminUserUpdate,
    AdminAddCredits,
    AdminResetCredits,
    AdminTrocarPlano,
    AdminMetricsOut,
    AdminUsageLogOut,
    AdminContentItem,
    AdminContentList,
    AdminContentDetail,
)
from ...schemas.admin_question_bank import (
    AdminQuestionItem,
    AdminQuestionListResponse,
    AdminQuestionUpdate,
    AdminQuestionApprovalRequest,
    AdminQuestionStats,
    AdminQuestionStatsItem,
    AdminQuestionCreate,
)
from ...services.subscription_service import PLANOS
from ...core.security import decode_token

router = APIRouter(prefix="/admin", tags=["admin"])


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


def _montar_admin_user(db: Session, user: User) -> AdminUserOut:
    """Monta o objeto de resposta com dados do usuário + assinatura."""
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()

    plan = None
    plan_status = None
    credits_total = None
    credits_used = None
    credits_available = None

    if sub:
        plan = sub.plan
        plan_status = sub.status
        credits_total = sub.credits_total / 10
        credits_used = sub.credits_used / 10
        credits_available = max(0, sub.credits_total - sub.credits_used) / 10

    return AdminUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        created_at=user.created_at,
        plan=plan,
        plan_status=plan_status,
        credits_total=credits_total,
        credits_used=credits_used,
        credits_available=credits_available,
    )


# ============================================================
# MÉTRICAS
# ============================================================
@router.get("/metrics", response_model=AdminMetricsOut)
def metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    total = db.query(User).count()
    ativos = db.query(User).filter(User.is_active == True).count()
    bloqueados = db.query(User).filter(User.is_active == False).count()

    trial = db.query(Subscription).filter(Subscription.plan == "trial").count()
    basico = db.query(Subscription).filter(Subscription.plan == "basico").count()
    padrao = db.query(Subscription).filter(Subscription.plan == "padrao").count()
    avancado = db.query(Subscription).filter(Subscription.plan == "avancado").count()

    total_usados = db.query(UsageLog).all()
    creditos_totais = sum(log.credits_consumed for log in total_usados) / 10

    sete_dias = datetime.utcnow() - timedelta(days=7)
    ultimos = db.query(User).filter(User.created_at >= sete_dias).count()

    return AdminMetricsOut(
        total_usuarios=total,
        usuarios_ativos=ativos,
        usuarios_bloqueados=bloqueados,
        usuarios_trial=trial,
        usuarios_basico=basico,
        usuarios_padrao=padrao,
        usuarios_avancado=avancado,
        creditos_consumidos_total=creditos_totais,
        ultimos_7_dias_cadastros=ultimos,
    )


# ============================================================
# LISTAR USUÁRIOS
# ============================================================
@router.get("/users", response_model=List[AdminUserOut])
def list_users(
    search: str = None,
    plan: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    query = db.query(User)

    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            (User.email.ilike(s)) | (User.full_name.ilike(s))
        )

    if plan:
        query = query.join(Subscription).filter(Subscription.plan == plan)

    users = query.order_by(User.created_at.desc()).all()
    return [_montar_admin_user(db, u) for u in users]


# ============================================================
# DETALHE DE USUÁRIO
# ============================================================
@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return _montar_admin_user(db, user)


# ============================================================
# ATUALIZAR USUÁRIO
# ============================================================
@router.put("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: str,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if user.id == current_user.id and data.is_active is False:
        raise HTTPException(status_code=400, detail="Você não pode bloquear a si mesmo.")

    if user.id == current_user.id and data.is_superuser is False:
        raise HTTPException(status_code=400, detail="Você não pode remover seu próprio acesso de admin.")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        existente = db.query(User).filter(User.email == data.email, User.id != user.id).first()
        if existente:
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
        user.email = data.email
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_superuser is not None:
        user.is_superuser = data.is_superuser

    db.commit()
    db.refresh(user)
    return _montar_admin_user(db, user)


# ============================================================
# EXCLUIR USUÁRIO (cascata)
# ============================================================
@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a si mesmo.")

    db.query(Subscription).filter(Subscription.user_id == user.id).delete()
    db.query(UsageLog).filter(UsageLog.user_id == user.id).delete()
    db.query(LessonPlan).filter(LessonPlan.user_id == user.id).delete()
    db.query(Reflection).filter(Reflection.user_id == user.id).delete()
    db.query(Material).filter(Material.user_id == user.id).delete()
    db.query(PedagogicalCase).filter(PedagogicalCase.user_id == user.id).delete()
    db.query(SuccessfulPractice).filter(SuccessfulPractice.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    return None


# ============================================================
# ADICIONAR / REMOVER CRÉDITOS
# ============================================================
@router.post("/users/{user_id}/credits/add", response_model=AdminUserOut)
def add_credits(
    user_id: str,
    data: AdminAddCredits,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()

    if not sub:
        sub = Subscription(
            user_id=user.id,
            plan="trial",
            status="active",
            credits_total=50,
            credits_used=0,
            period_start=datetime.utcnow(),
            period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    delta_decimos = int(data.quantidade * 10)
    novo_total = sub.credits_total + delta_decimos
    if novo_total < 0:
        raise HTTPException(status_code=400, detail="O total de créditos não pode ser negativo.")

    sub.credits_total = novo_total
    db.commit()
    db.refresh(sub)
    return _montar_admin_user(db, user)


# ============================================================
# RESETAR CRÉDITOS USADOS
# ============================================================
@router.post("/users/{user_id}/credits/reset", response_model=AdminUserOut)
def reset_credits(
    user_id: str,
    data: AdminResetCredits,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Assinatura não encontrada.")

    sub.credits_used = 0
    db.commit()
    db.refresh(sub)
    return _montar_admin_user(db, user)


# ============================================================
# TROCAR PLANO (manual)
# ============================================================
@router.post("/users/{user_id}/plan", response_model=AdminUserOut)
def change_plan(
    user_id: str,
    data: AdminTrocarPlano,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    if data.plano not in PLANOS:
        raise HTTPException(status_code=400, detail=f"Plano inválido. Opções: {list(PLANOS.keys())}")

    plano_info = PLANOS[data.plano]

    if data.creditos_total is not None:
        creditos_decimos = int(data.creditos_total * 10)
    else:
        creditos_decimos = plano_info["creditos_mes"]

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()

    if sub:
        sub.plan = data.plano
        sub.status = "active"
        sub.credits_total = creditos_decimos
        sub.credits_used = 0
        sub.period_start = datetime.utcnow()
        sub.period_end = datetime.utcnow() + timedelta(days=30)
    else:
        sub = Subscription(
            user_id=user.id,
            plan=data.plano,
            status="active",
            credits_total=creditos_decimos,
            credits_used=0,
            period_start=datetime.utcnow(),
            period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(sub)

    db.commit()
    db.refresh(sub)
    return _montar_admin_user(db, user)


# ============================================================
# LOGS DE USO
# ============================================================
@router.get("/usage", response_model=List[AdminUsageLogOut])
def list_usage(
    user_id: str = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    query = db.query(UsageLog)
    if user_id:
        query = query.filter(UsageLog.user_id == user_id)
    logs = query.order_by(UsageLog.created_at.desc()).limit(limit).all()

    resultado = []
    for log in logs:
        resultado.append(AdminUsageLogOut(
            id=log.id,
            user_id=log.user_id,
            task_type=log.task_type,
            credits_consumed=log.credits_consumed / 10,
            created_at=log.created_at,
        ))
    return resultado


# ============================================================
# CONTEÚDOS GERADOS POR USUÁRIO
# ============================================================
@router.get("/users/{user_id}/content", response_model=AdminContentList)
def list_user_content(
    user_id: str,
    content_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    items: List[AdminContentItem] = []

    if not content_type or content_type == "pratica_exitosa":
        for p in db.query(SuccessfulPractice).filter(
            SuccessfulPractice.user_id == user_id
        ).order_by(SuccessfulPractice.created_at.desc()).all():
            subtitulo_partes = [p.flow_type, p.category]
            if p.grade:
                subtitulo_partes.append(p.grade)
            items.append(AdminContentItem(
                id=p.id,
                content_type="pratica_exitosa",
                title=p.title,
                subtitle=" • ".join([str(x) for x in subtitulo_partes if x]),
                created_at=p.created_at,
            ))

    if not content_type or content_type == "material":
        for m in db.query(Material).filter(
            Material.user_id == user_id
        ).order_by(Material.created_at.desc()).all():
            subtitulo_partes = [m.material_type]
            if m.grade:
                subtitulo_partes.append(m.grade)
            if m.subject:
                subtitulo_partes.append(m.subject)
            items.append(AdminContentItem(
                id=m.id,
                content_type="material",
                title=m.title,
                subtitle=" • ".join([str(x) for x in subtitulo_partes if x]),
                created_at=m.created_at,
            ))

    if not content_type or content_type in ("neuroaula", "aula_que_funciona"):
        q = db.query(LessonPlan).filter(LessonPlan.user_id == user_id)
        if content_type:
            q = q.filter(LessonPlan.plan_type == content_type)
        for lp in q.order_by(LessonPlan.created_at.desc()).all():
            subtitulo_partes = [lp.plan_type]
            if lp.grade:
                subtitulo_partes.append(lp.grade)
            if lp.subject:
                subtitulo_partes.append(lp.subject)
            items.append(AdminContentItem(
                id=lp.id,
                content_type=lp.plan_type,
                title=lp.title,
                subtitle=" • ".join([str(x) for x in subtitulo_partes if x]),
                created_at=lp.created_at,
            ))

    if not content_type or content_type == "reflection":
        for r in db.query(Reflection).filter(
            Reflection.user_id == user_id
        ).order_by(Reflection.created_at.desc()).all():
            n_msgs = len(r.messages or [])
            items.append(AdminContentItem(
                id=r.id,
                content_type="reflection",
                title=r.title,
                subtitle=f"{r.theme or 'sem tema'} • {n_msgs} mensagens",
                created_at=r.created_at,
            ))

    if not content_type or content_type == "pedagogical_case":
        for pc in db.query(PedagogicalCase).filter(
            PedagogicalCase.user_id == user_id
        ).order_by(PedagogicalCase.created_at.desc()).all():
            subtitulo_partes = []
            if pc.grade:
                subtitulo_partes.append(pc.grade)
            if pc.subject:
                subtitulo_partes.append(pc.subject)
            items.append(AdminContentItem(
                id=pc.id,
                content_type="pedagogical_case",
                title=pc.title,
                subtitle=" • ".join([str(x) for x in subtitulo_partes if x]) or "situação pedagógica",
                created_at=pc.created_at,
            ))

    items.sort(key=lambda x: x.created_at, reverse=True)

    counts: dict = {}
    for it in items:
        counts[it.content_type] = counts.get(it.content_type, 0) + 1

    return AdminContentList(items=items, total=len(items), counts=counts)


@router.get("/content/{content_type}/{content_id}", response_model=AdminContentDetail)
def get_content_detail(
    content_type: str,
    content_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    tipos_validos = ("pratica_exitosa", "material", "neuroaula", "aula_que_funciona", "reflection", "pedagogical_case")
    if content_type not in tipos_validos:
        raise HTTPException(status_code=400, detail=f"Tipo inválido. Use: {tipos_validos}")

    if content_type == "pratica_exitosa":
        item = db.query(SuccessfulPractice).filter(SuccessfulPractice.id == content_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return AdminContentDetail(
            id=item.id,
            content_type=content_type,
            title=item.title,
            created_at=item.created_at,
            data={
                "perfil": item.perfil,
                "flow_type": item.flow_type,
                "sub_flow": item.sub_flow,
                "category": item.category,
                "school": item.school,
                "city": item.city,
                "gre": item.gre,
                "grade": item.grade,
                "subject": item.subject,
                "num_alunos": item.num_alunos,
                "has_special_needs": item.has_special_needs,
                "duration": item.duration,
                "description": item.description,
                "structured_data": item.structured_data,
            },
        )

    if content_type == "material":
        item = db.query(Material).filter(Material.id == content_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return AdminContentDetail(
            id=item.id,
            content_type=content_type,
            title=item.title,
            created_at=item.created_at,
            data={
                "material_type": item.material_type,
                "subject": item.subject,
                "grade": item.grade,
                "content": item.content,
                "diferenciado": item.diferenciado,
                "structured_data": item.structured_data,
            },
        )

    if content_type in ("neuroaula", "aula_que_funciona"):
        item = db.query(LessonPlan).filter(LessonPlan.id == content_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return AdminContentDetail(
            id=item.id,
            content_type=content_type,
            title=item.title,
            created_at=item.created_at,
            data={
                "plan_type": item.plan_type,
                "subject": item.subject,
                "grade": item.grade,
                "content": item.content,
                "objective": item.objective,
                "structured_data": item.structured_data,
            },
        )

    if content_type == "reflection":
        item = db.query(Reflection).filter(Reflection.id == content_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return AdminContentDetail(
            id=item.id,
            content_type=content_type,
            title=item.title,
            created_at=item.created_at,
            data={
                "theme": item.theme,
                "messages": item.messages,
                "summary": item.summary,
            },
        )

    if content_type == "pedagogical_case":
        item = db.query(PedagogicalCase).filter(PedagogicalCase.id == content_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return AdminContentDetail(
            id=item.id,
            content_type=content_type,
            title=item.title,
            created_at=item.created_at,
            data={
                "grade": item.grade,
                "subject": item.subject,
                "description": item.description,
                "frequencia": item.frequencia,
                "situacoes": item.situacoes,
                "reacao_aluno": item.reacao_aluno,
                "ja_tentou": item.ja_tentou,
                "contexto_adicional": item.contexto_adicional,
                "analysis": item.analysis,
                "notes": item.notes,
            },
        )


# ═══════════════════════════════════════════════════════════════
# CURADORIA — BANCO DE QUESTÕES FUNDAMENTAL
# ═══════════════════════════════════════════════════════════════

def _montar_question_item(q: QuestionBankFundamental, db: Session) -> AdminQuestionItem:
    """Monta o item com dados do professor que enviou."""
    nome_autor = None
    email_autor = None
    if q.submitted_by:
        user = db.query(User).filter(User.id == q.submitted_by).first()
        if user:
            nome_autor = user.full_name
            email_autor = user.email

    return AdminQuestionItem(
        id=q.id,
        fonte=q.fonte,
        ano=q.ano,
        etapa=q.etapa,
        serie=q.serie,
        componente=q.componente,
        disciplina=q.disciplina,
        unidade_tematica=q.unidade_tematica,
        objeto_conhecimento=q.objeto_conhecimento,
        numero=q.numero,
        tipo=q.tipo,
        enunciado=q.enunciado,
        alternativas=q.alternativas,
        gabarito=q.gabarito,
        imagem_url=q.imagem_url,
        habilidade_codigo=q.habilidade_codigo,
        referencial=q.referencial,
        descritores=q.descritores,
        dificuldade=q.dificuldade,
        origem=q.origem,
        approved=q.approved,
        submitted_by=q.submitted_by,
        submitted_by_email=email_autor,
        submitted_by_name=nome_autor,
        created_at=q.created_at,
    )


@router.get("/question-bank/stats", response_model=AdminQuestionStats)
def admin_question_bank_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Estatísticas do banco de questões fundamental."""
    total_pendentes = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.approved == False,
        QuestionBankFundamental.anulada == False,
    ).count()

    total_aprovadas = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.approved == True,
        QuestionBankFundamental.anulada == False,
    ).count()

    total_anuladas = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.anulada == True,
    ).count()

    rows_autor = (
        db.query(QuestionBankFundamental.submitted_by, func.count(QuestionBankFundamental.id))
        .filter(QuestionBankFundamental.submitted_by.isnot(None))
        .group_by(QuestionBankFundamental.submitted_by)
        .order_by(func.count(QuestionBankFundamental.id).desc())
        .limit(20)
        .all()
    )
    por_autor = []
    for sub_id, qtd in rows_autor:
        u = db.query(User).filter(User.id == sub_id).first()
        chave = u.full_name if u else "Desconhecido"
        por_autor.append(AdminQuestionStatsItem(chave=chave, quantidade=qtd))

    def agrupar(campo):
        rows = (
            db.query(campo, func.count(QuestionBankFundamental.id))
            .filter(campo.isnot(None))
            .group_by(campo)
            .all()
        )
        return [AdminQuestionStatsItem(chave=str(r[0]), quantidade=r[1]) for r in rows if r[0]]

    return AdminQuestionStats(
        total_pendentes=total_pendentes,
        total_aprovadas=total_aprovadas,
        total_anuladas=total_anuladas,
        por_autor=por_autor,
        por_componente=agrupar(QuestionBankFundamental.componente),
        por_referencial=agrupar(QuestionBankFundamental.referencial),
    )


@router.get("/question-bank/pendentes", response_model=AdminQuestionListResponse)
def admin_question_bank_pendentes(
    etapa: Optional[str] = Query(None),
    componente: Optional[str] = Query(None),
    referencial: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Lista questões aguardando aprovação (curadoria)."""
    query = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.approved == False,
        QuestionBankFundamental.anulada == False,
    )

    if etapa:
        query = query.filter(QuestionBankFundamental.etapa == etapa)
    if componente:
        query = query.filter(QuestionBankFundamental.componente == componente)
    if referencial:
        query = query.filter(QuestionBankFundamental.referencial == referencial)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(func.lower(QuestionBankFundamental.enunciado).like(termo))

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens = (
        query.order_by(QuestionBankFundamental.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return AdminQuestionListResponse(
        items=[_montar_question_item(q, db) for q in itens],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/question-bank/aprovadas", response_model=AdminQuestionListResponse)
def admin_question_bank_aprovadas(
    etapa: Optional[str] = Query(None),
    componente: Optional[str] = Query(None),
    referencial: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Lista questões já aprovadas."""
    query = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.approved == True,
        QuestionBankFundamental.anulada == False,
    )

    if etapa:
        query = query.filter(QuestionBankFundamental.etapa == etapa)
    if componente:
        query = query.filter(QuestionBankFundamental.componente == componente)
    if referencial:
        query = query.filter(QuestionBankFundamental.referencial == referencial)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(func.lower(QuestionBankFundamental.enunciado).like(termo))

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens = (
        query.order_by(QuestionBankFundamental.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return AdminQuestionListResponse(
        items=[_montar_question_item(q, db) for q in itens],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/question-bank/{question_id}", response_model=AdminQuestionItem)
def admin_question_bank_detalhe(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Retorna uma questão para inspeção completa."""
    q = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    return _montar_question_item(q, db)


@router.patch("/question-bank/{question_id}/aprovar", response_model=AdminQuestionItem)
def admin_question_bank_aprovar(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Aprova uma questão (fica visível no Motor 8)."""
    q = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    q.approved = True
    q.approved_by = current_user.id
    q.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(q)
    return _montar_question_item(q, db)


@router.patch("/question-bank/{question_id}/rejeitar", response_model=AdminQuestionItem)
def admin_question_bank_rejeitar(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Rejeita uma questão (move para a lixeira)."""
    q = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    q.anulada = True
    q.approved = False
    q.approved_by = current_user.id
    q.approved_at = datetime.utcnow()
    q.trashed_at = datetime.utcnow()
    db.commit()
    db.refresh(q)
    return _montar_question_item(q, db)


@router.patch("/question-bank/aprovar-lote")
def admin_question_bank_aprovar_lote(
    data: AdminQuestionApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Aprova várias questões de uma vez."""
    qs = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id.in_(data.ids)).all()
    total = 0
    for q in qs:
        q.approved = True
        q.approved_by = current_user.id
        q.approved_at = datetime.utcnow()
        total += 1
    db.commit()
    return {"sucesso": True, "total_aprovado": total}


@router.patch("/question-bank/rejeitar-lote")
def admin_question_bank_rejeitar_lote(
    data: AdminQuestionApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Rejeita várias questões de uma vez (manda para a lixeira)."""
    qs = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id.in_(data.ids)).all()
    total = 0
    agora = datetime.utcnow()
    for q in qs:
        q.anulada = True
        q.approved = False
        q.approved_by = current_user.id
        q.approved_at = agora
        q.trashed_at = agora
        total += 1
    db.commit()
    return {"sucesso": True, "total_rejeitado": total}


@router.put("/question-bank/{question_id}", response_model=AdminQuestionItem)
def admin_question_bank_editar(
    question_id: str,
    data: AdminQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Edita uma questão antes de aprovar."""
    q = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    if data.enunciado is not None:
        q.enunciado = data.enunciado
    if data.alternativas is not None:
        q.alternativas = data.alternativas
    if data.gabarito is not None:
        q.gabarito = data.gabarito
    if data.habilidade_codigo is not None:
        q.habilidade_codigo = data.habilidade_codigo
    if data.referencial is not None:
        q.referencial = data.referencial
    if data.ano is not None:
        q.ano = data.ano
    if data.etapa is not None:
        q.etapa = data.etapa
    if data.serie is not None:
        q.serie = data.serie
    if data.componente is not None:
        q.componente = data.componente
    if data.disciplina is not None:
        q.disciplina = data.disciplina
    if data.unidade_tematica is not None:
        q.unidade_tematica = data.unidade_tematica
    if data.objeto_conhecimento is not None:
        q.objeto_conhecimento = data.objeto_conhecimento
    if data.dificuldade is not None:
        q.dificuldade = data.dificuldade
    if data.imagem_url is not None:
        q.imagem_url = data.imagem_url
    if data.descritores is not None:
        q.descritores = data.descritores

    db.commit()
    db.refresh(q)
    return _montar_question_item(q, db)


@router.delete("/question-bank/{question_id}", status_code=204)
def admin_question_bank_excluir(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Exclui definitivamente uma questão."""
    q = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")
    db.delete(q)
    db.commit()
    return None


# ═══════════════════════════════════════════════════════════════
# LIXEIRA DE REJEITADAS (Bloco 4.9.3)
# ═══════════════════════════════════════════════════════════════

DIAS_LIXEIRA = 30  # tempo em dias antes de exclusão permanente


def _limpar_lixeira_antiga(db: Session) -> int:
    """Remove automaticamente questões na lixeira há mais de DIAS_LIXEIRA."""
    limite = datetime.utcnow() - timedelta(days=DIAS_LIXEIRA)
    qs = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.anulada == True,
        QuestionBankFundamental.trashed_at.isnot(None),
        QuestionBankFundamental.trashed_at < limite,
    ).all()
    total = 0
    for q in qs:
        db.delete(q)
        total += 1
    if total > 0:
        db.commit()
        print(f"[Lixeira] {total} questão(ões) excluída(s) permanentemente (> {DIAS_LIXEIRA} dias).")
    return total


def _montar_question_item_com_dias(q: QuestionBankFundamental, db: Session) -> AdminQuestionItem:
    """Igual ao _montar_question_item, mas adiciona dias_ate_exclusao se estiver na lixeira."""
    item = _montar_question_item(q, db)
    if q.anulada and q.trashed_at:
        dias_passados = (datetime.utcnow() - q.trashed_at).days
        item.trashed_at = q.trashed_at
        item.dias_ate_exclusao = max(0, DIAS_LIXEIRA - dias_passados)
    return item


@router.get("/question-bank/rejeitadas", response_model=AdminQuestionListResponse)
def admin_question_bank_rejeitadas(
    etapa: Optional[str] = Query(None),
    componente: Optional[str] = Query(None),
    referencial: Optional[str] = Query(None),
    busca: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Lista questões na lixeira (rejeitadas).
    Auto-limpa as que passaram de 30 dias.
    """
    # Limpeza automática das muito antigas
    _limpar_lixeira_antiga(db)

    query = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.anulada == True,
    )

    if etapa:
        query = query.filter(QuestionBankFundamental.etapa == etapa)
    if componente:
        query = query.filter(QuestionBankFundamental.componente == componente)
    if referencial:
        query = query.filter(QuestionBankFundamental.referencial == referencial)
    if busca:
        termo = f"%{busca.lower()}%"
        query = query.filter(func.lower(QuestionBankFundamental.enunciado).like(termo))

    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))
    offset = (page - 1) * per_page

    itens = (
        query.order_by(QuestionBankFundamental.trashed_at.desc().nullslast(),
                       QuestionBankFundamental.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )

    return AdminQuestionListResponse(
        items=[_montar_question_item_com_dias(q, db) for q in itens],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.patch("/question-bank/{question_id}/restaurar", response_model=AdminQuestionItem)
def admin_question_bank_restaurar(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Restaura uma questão da lixeira (volta para pendentes)."""
    q = db.query(QuestionBankFundamental).filter(QuestionBankFundamental.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada.")

    q.anulada = False
    q.approved = False
    q.trashed_at = None
    q.approved_by = None
    q.approved_at = None
    db.commit()
    db.refresh(q)
    return _montar_question_item(q, db)


@router.delete("/question-bank/limpar-lixeira")
def admin_question_bank_limpar_lixeira(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Força a limpeza da lixeira (remove tudo que passou de 30 dias)."""
    total = _limpar_lixeira_antiga(db)
    return {"sucesso": True, "total_removido": total}


@router.delete("/question-bank/esvaziar-lixeira")
def admin_question_bank_esvaziar_lixeira(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Esvazia TODA a lixeira imediatamente (ação perigosa)."""
    qs = db.query(QuestionBankFundamental).filter(
        QuestionBankFundamental.anulada == True,
    ).all()
    total = 0
    for q in qs:
        db.delete(q)
        total += 1
    db.commit()
    return {"sucesso": True, "total_removido": total}


# ═══════════════════════════════════════════════════════════════
# CRIAÇÃO MANUAL DE QUESTÕES (Bloco 3.5.1) — NOVO
# ═══════════════════════════════════════════════════════════════

@router.post("/question-bank/criar", response_model=AdminQuestionItem, status_code=201)
def admin_question_bank_criar(
    data: AdminQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Cria uma questão manualmente (admin). Já entra aprovada por padrão."""
    if data.etapa not in ("EI", "EF"):
        raise HTTPException(status_code=400, detail="Etapa deve ser 'EI' ou 'EF'.")
    if not data.enunciado or len(data.enunciado.strip()) < 10:
        raise HTTPException(status_code=400, detail="Enunciado muito curto (mínimo 10 caracteres).")

    nova = QuestionBankFundamental(
        fonte="SIMIDNAPE_ADMIN",
        ano=data.ano,
        etapa=data.etapa,
        serie=data.serie,
        componente=data.componente,
        disciplina=data.disciplina or data.componente,
        unidade_tematica=data.unidade_tematica,
        objeto_conhecimento=data.objeto_conhecimento,
        numero=None,
        tipo=data.tipo,
        enunciado=data.enunciado.strip(),
        alternativas=data.alternativas,
        gabarito=data.gabarito,
        imagem_url=data.imagem_url,
        imagens_extras=data.imagens_extras,
        habilidades=[data.habilidade_codigo] if data.habilidade_codigo else None,
        habilidade_codigo=data.habilidade_codigo,
        referencial=data.referencial,
        descritores=data.descritores,
        dificuldade=data.dificuldade,
        origem="manual",
        submitted_by=current_user.id,
        approved=data.aprovada,
        approved_by=current_user.id if data.aprovada else None,
        approved_at=datetime.utcnow() if data.aprovada else None,
        anulada=False,
    )

    db.add(nova)
    db.commit()
    db.refresh(nova)
    return _montar_question_item(nova, db)