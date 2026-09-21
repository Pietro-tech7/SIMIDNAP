from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from ...core.database import get_db
from ...models.user import User
from ...services.subscription_service import (
    info_assinatura,
    trocar_plano,
    listar_planos,
)
from ...services.payment_service import (
    create_subscription_checkout,
    create_credits_checkout,
    create_pix_subscription,
    create_pix_credits,
    get_payment_status,
    cancel_subscription,
    get_payment_history,
    list_packages,
    process_webhook,
)
from ...schemas.subscription import (
    CheckoutSubscriptionRequest,
    CheckoutCreditsRequest,
    CancelSubscriptionRequest,
    CheckoutResponse,
    SubscriptionStatusOut,
    PlanoOut,
    PacoteCreditosOut,
    PaymentHistoryItem,
)
from ...core.security import decode_token

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


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


class TrocarPlanoRequest(BaseModel):
    plano: str


# ============================================================
# LISTAR PLANOS E PACOTES
# ============================================================
@router.get("/planos", response_model=List[PlanoOut])
def planos():
    return listar_planos()


@router.get("/packages", response_model=List[PacoteCreditosOut])
def packages():
    return list_packages()


# ============================================================
# STATUS DA ASSINATURA
# ============================================================
@router.get("/status", response_model=SubscriptionStatusOut)
def status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return info_assinatura(db, str(current_user.id))


# ============================================================
# PIX — ASSINATURA (Checkout Transparente)
# ============================================================
@router.post("/pix/subscription")
def pix_subscription(
    data: CheckoutSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma cobrança Pix para assinatura mensal.
    Retorna o QR Code (base64) e o código copia-e-cola para o frontend renderizar.
    """
    try:
        return create_pix_subscription(db, current_user, data.plan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Pix Subscription] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar QR Code Pix. Tente novamente em alguns instantes."
        )


# ============================================================
# PIX — CRÉDITOS AVULSOS (Checkout Transparente)
# ============================================================
@router.post("/pix/credits")
def pix_credits(
    data: CheckoutCreditsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria uma cobrança Pix para compra de créditos avulsos.
    Retorna o QR Code (base64) e o código copia-e-cola.
    """
    try:
        return create_pix_credits(db, current_user, data.package)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Pix Credits] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar QR Code Pix. Tente novamente em alguns instantes."
        )


# ============================================================
# CONSULTAR STATUS DE PAGAMENTO (polling do frontend)
# ============================================================
@router.get("/payment-status/{payment_id}")
def payment_status(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Consulta o status de um pagamento Pix no Mercado Pago.
    Usado pelo frontend para verificar se o Pix foi pago.
    """
    try:
        return get_payment_status(db, current_user, payment_id)
    except Exception as e:
        print(f"[Payment Status] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao consultar status do pagamento."
        )


# ============================================================
# CHECKOUT PRO — ASSINATURA (cartão/débito, com redirecionamento)
# ============================================================
@router.post("/checkout", response_model=CheckoutResponse)
def checkout_subscription(
    data: CheckoutSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = create_subscription_checkout(db, current_user, data.plan)
        return CheckoutResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Checkout Subscription] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao criar assinatura. Tente novamente em alguns instantes."
        )


# ============================================================
# CHECKOUT PRO — CRÉDITOS (cartão/débito)
# ============================================================
@router.post("/checkout-credits", response_model=CheckoutResponse)
def checkout_credits(
    data: CheckoutCreditsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = create_credits_checkout(db, current_user, data.package)
        return CheckoutResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[Checkout Credits] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao criar compra de créditos. Tente novamente em alguns instantes."
        )


# ============================================================
# CANCELAR ASSINATURA
# ============================================================
@router.post("/cancel")
def cancel(
    data: CancelSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        sub = cancel_subscription(db, current_user)
        return {
            "message": "Assinatura cancelada com sucesso.",
            "status": sub.status,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"[Cancel Subscription] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao cancelar assinatura. Tente novamente."
        )


# ============================================================
# HISTÓRICO DE COMPRAS
# ============================================================
@router.get("/history", response_model=List[PaymentHistoryItem])
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    itens = get_payment_history(db, current_user)
    return [
        PaymentHistoryItem(
            id=item.id,
            payment_provider_id=item.payment_provider_id,
            amount=item.amount / 100,
            credits_added=item.credits_added / 10,
            status=item.status,
            payment_method=item.payment_method,
            created_at=item.created_at,
        )
        for item in itens
    ]


# ============================================================
# WEBHOOK — MERCADO PAGO
# ============================================================
@router.post("/webhook")
async def webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    query_params = dict(request.query_params)
    if query_params:
        payload.update(query_params)

    try:
        resultado = process_webhook(db, payload)
        print(f"[Webhook MP] {resultado}")
        return {"ok": True}
    except Exception as e:
        print(f"[Webhook MP] Erro ao processar: {e}")
        return {"ok": False, "error": str(e)}


# ============================================================
# TROCAR PLANO (manual — admin)
# ============================================================
@router.post("/trocar")
def trocar(
    data: TrocarPlanoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Use o checkout para trocar de plano."
        )
    try:
        trocar_plano(db, str(current_user.id), data.plano)
        return info_assinatura(db, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))