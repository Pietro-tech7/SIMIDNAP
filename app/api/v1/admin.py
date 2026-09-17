from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from ...core.database import get_db
from ...models.user import User
from ...models.subscription import Subscription, UsageLog
from ...models.lesson_plan import LessonPlan
from ...models.reflection import Reflection
from ...models.material import Material
from ...models.pedagogical_case import PedagogicalCase
from ...schemas.admin import (
    AdminUserOut,
    AdminUserUpdate,
    AdminAddCredits,
    AdminResetCredits,
    AdminTrocarPlano,
    AdminMetricsOut,
    AdminUsageLogOut,
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

    # Se não existir assinatura, cria uma trial
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

    # Valor em décimos
    if data.creditos_total is not None:
        creditos_decimos = int(data.creditos_total * 10)
    else:
        creditos_decimos = plano_info["creditos_mes"]

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()

    if sub:
        # Atualiza a assinatura existente
        sub.plan = data.plano
        sub.status = "active"
        sub.credits_total = creditos_decimos
        sub.credits_used = 0
        sub.period_start = datetime.utcnow()
        sub.period_end = datetime.utcnow() + timedelta(days=30)
    else:
        # Cria nova assinatura
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