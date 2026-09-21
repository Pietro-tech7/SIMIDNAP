"""
Serviço de integração com o Mercado Pago (Checkout Pro).

Fluxos implementados:
1. Assinatura mensal (recorrente) via /preapproval
2. Compra de créditos avulsos via /checkout/preferences
3. Webhook para receber notificações (payment + preapproval)
4. Cancelamento de assinatura

Credenciais:
- MERCADOPAGO_ACCESS_TOKEN (env)
- MERCADOPAGO_PUBLIC_KEY (env, apenas para uso futuro no frontend)

Uso em produção: substituir TEST- por APP_USR- no .env / Railway.
"""

import os
import time
import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from ..models.subscription import Subscription, PaymentHistory, UsageLog
from ..models.user import User


# ============================================================
# CONFIGURAÇÃO
# ============================================================
MP_BASE = "https://api.mercadopago.com"

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://simidnape.com.br")
BACKEND_URL = os.getenv(
    "BACKEND_URL",
    f"https://{os.getenv('RAILWAY_PUBLIC_DOMAIN', 'web-production-419ca.up.railway.app')}"
)

# Preços dos planos (mensal, em reais)
PLANOS_PRECOS = {
    "basico": 9.90,
    "padrao": 19.90,
    "avancado": 49.90,
}

# Pacotes de créditos avulsos (preços deliberadamente mais altos
# que os créditos equivalentes do plano mensal, para incentivar a assinatura)
PACOTES_CREDITOS = {
    "pack_5":  {"creditos": 5,  "preco": 4.90,  "nome": "5 créditos"},
    "pack_10": {"creditos": 10, "preco": 12.90, "nome": "10 créditos"},
    "pack_25": {"creditos": 25, "preco": 24.90, "nome": "25 créditos"},
}


# ============================================================
# HELPERS INTERNOS
# ============================================================
def _headers() -> Dict[str, str]:
    token = os.getenv("MERCADOPAGO_ACCESS_TOKEN")
    if not token:
        raise Exception("MERCADOPAGO_ACCESS_TOKEN não configurado.")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _montar_external_reference(user_id: str, tipo: str, item: str) -> str:
    """Gera uma referência única: user_id|tipo|item|timestamp."""
    return f"{user_id}|{tipo}|{item}|{int(time.time())}"


def _parse_external_reference(ref: str) -> Dict[str, Optional[str]]:
    """Faz o parse de uma external_reference."""
    partes = (ref or "").split("|")
    return {
        "user_id": partes[0] if len(partes) > 0 else None,
        "tipo":    partes[1] if len(partes) > 1 else None,
        "item":    partes[2] if len(partes) > 2 else None,
    }


# ============================================================
# CHECKOUT DE ASSINATURA (recorrente)
# ============================================================
def create_subscription_checkout(db: Session, user: User, plan: str) -> Dict[str, Any]:
    """
    Cria uma assinatura recorrente no Mercado Pago (preapproval).
    Retorna a URL de checkout para o usuário pagar.
    """
    if plan not in PLANOS_PRECOS:
        raise ValueError(f"Plano inválido: {plan}. Use: {list(PLANOS_PRECOS.keys())}")

    preco = PLANOS_PRECOS[plan]
    external_ref = _montar_external_reference(str(user.id), "subscription", plan)

    body = {
        "reason": f"SIMIDNAPE PRO - Plano {plan.capitalize()}",
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": preco,
            "currency_id": "BRL",
        },
        "back_url": f"{FRONTEND_URL}/minha-assinatura",
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "payer_email": user.email,
        "external_reference": external_ref,
        "status": "pending",
    }

    resp = requests.post(f"{MP_BASE}/preapproval", json=body, headers=_headers(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()

    # Atualiza (ou cria) a Subscription local em estado pendente
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(
            user_id=user.id,
            plan="trial",
            status="active",
            credits_total=50,
            credits_used=0,
        )
        db.add(sub)
        db.flush()

    sub.payment_provider = "mercadopago"
    sub.payment_provider_id = data.get("id")
    sub.payment_status = "pending"
    sub.external_reference = external_ref
    sub.payment_metadata = data
    db.commit()
    db.refresh(sub)

    return {
        "checkout_url": data.get("init_point"),
        "external_reference": external_ref,
        "provider_id": data.get("id"),
    }


# ============================================================
# CHECKOUT DE CRÉDITOS AVULSOS (uma vez)
# ============================================================
def create_credits_checkout(db: Session, user: User, package: str) -> Dict[str, Any]:
    """
    Cria um pagamento avulso no Checkout Pro do Mercado Pago.
    Retorna a URL de checkout.
    """
    if package not in PACOTES_CREDITOS:
        raise ValueError(f"Pacote inválido: {package}. Use: {list(PACOTES_CREDITOS.keys())}")

    pacote = PACOTES_CREDITOS[package]
    external_ref = _montar_external_reference(str(user.id), "credits", package)

    body = {
        "items": [{
            "title": f"SIMIDNAPE PRO - {pacote['nome']}",
            "description": "Créditos adicionais para uso nos motores de IA do SIMIDNAPE PRO.",
            "quantity": 1,
            "unit_price": pacote["preco"],
            "currency_id": "BRL",
        }],
        "payer": {"email": user.email},
        "back_urls": {
            "success": f"{FRONTEND_URL}/minha-assinatura?status=success",
            "failure": f"{FRONTEND_URL}/minha-assinatura?status=failure",
            "pending": f"{FRONTEND_URL}/minha-assinatura?status=pending",
        },
        "auto_return": "approved",
        "external_reference": external_ref,
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "statement_descriptor": "SIMIDNAPE",
    }

    resp = requests.post(f"{MP_BASE}/checkout/preferences", json=body, headers=_headers(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()

    # Registra a intenção de compra
    hist = PaymentHistory(
        user_id=user.id,
        payment_provider="mercadopago",
        payment_provider_id=str(data.get("id")),
        external_reference=external_ref,
        amount=int(pacote["preco"] * 100),  # centavos
        credits_added=pacote["creditos"] * 10,  # décimos
        status="pending",
        metadata=data,
    )
    db.add(hist)
    db.commit()
    db.refresh(hist)

    return {
        "checkout_url": data.get("init_point"),
        "external_reference": external_ref,
        "provider_id": str(data.get("id")),
    }


# ============================================================
# WEBHOOK — PROCESSAR NOTIFICAÇÕES DO MP
# ============================================================
def process_webhook(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processa uma notificação enviada pelo Mercado Pago.
    Tipos suportados: 'payment' (créditos avulsos) e 'preapproval' (assinatura).
    """
    topic = payload.get("type") or payload.get("topic")
    data_id = (payload.get("data") or {}).get("id") or payload.get("id")

    if not data_id:
        return {"ok": False, "reason": "id_ausente"}

    if topic == "payment":
        return _handle_payment(db, data_id)
    if topic == "preapproval":
        return _handle_preapproval(db, data_id)
    if topic == "subscription_authorized_payment":
        return _handle_authorized_payment(db, data_id)

    return {"ok": True, "ignored": topic}


def _handle_payment(db: Session, payment_id: str) -> Dict[str, Any]:
    """Processa notificação de pagamento avulso (créditos)."""
    resp = requests.get(f"{MP_BASE}/v1/payments/{payment_id}", headers=_headers(), timeout=30)
    if resp.status_code != 200:
        return {"ok": False, "reason": "fetch_payment_failed"}

    data = resp.json()
    ext_ref = data.get("external_reference", "")
    info = _parse_external_reference(ext_ref)

    if info["tipo"] != "credits":
        return {"ok": True, "ignored": "not_credits"}

    hist = db.query(PaymentHistory).filter(
        PaymentHistory.external_reference == ext_ref
    ).first()
    if not hist:
        return {"ok": False, "reason": "history_not_found"}

    status_mp = data.get("status")  # approved, pending, rejected, refunded
    hist.status = status_mp
    hist.payment_provider_id = str(payment_id)
    hist.payment_method = data.get("payment_method_id")

    meta = hist.metadata or {}
    meta["last_webhook"] = data
    hist.metadata = meta

    # Se aprovado e ainda não creditamos, adiciona créditos
    if status_mp == "approved" and not meta.get("_credits_added"):
        sub = db.query(Subscription).filter(Subscription.user_id == hist.user_id).first()
        if sub:
            sub.credits_total += hist.credits_added
            db.add(UsageLog(
                user_id=hist.user_id,
                task_type=f"purchase_{info['item'] or 'credits'}",
                credits_consumed=-hist.credits_added,  # negativo = crédito adicionado
            ))
        meta["_credits_added"] = True
        hist.metadata = meta

    db.commit()
    return {"ok": True, "status": status_mp}


def _handle_preapproval(db: Session, preapproval_id: str) -> Dict[str, Any]:
    """Processa notificação de assinatura (preapproval)."""
    resp = requests.get(f"{MP_BASE}/preapproval/{preapproval_id}", headers=_headers(), timeout=30)
    if resp.status_code != 200:
        return {"ok": False, "reason": "fetch_preapproval_failed"}

    data = resp.json()
    ext_ref = data.get("external_reference", "")
    info = _parse_external_reference(ext_ref)

    sub = db.query(Subscription).filter(
        Subscription.external_reference == ext_ref
    ).first()
    if not sub:
        return {"ok": False, "reason": "subscription_not_found"}

    status_mp = data.get("status")  # pending, authorized, paused, cancelled
    sub.payment_status = status_mp
    sub.payment_provider_id = preapproval_id

    meta = sub.payment_metadata or {}
    meta["last_webhook"] = data
    sub.payment_metadata = meta

    # Ativa a assinatura quando autorizada
    if status_mp == "authorized":
        plan = info.get("item") or sub.plan
        # Importa aqui para evitar circular
        from .subscription_service import PLANOS
        if plan in PLANOS:
            sub.plan = plan
            sub.status = "active"
            sub.credits_total = PLANOS[plan]["creditos_mes"]
            sub.credits_used = 0
            sub.period_start = datetime.utcnow()
            sub.period_end = datetime.utcnow() + timedelta(days=30)

    elif status_mp == "cancelled":
        sub.status = "canceled"

    db.commit()
    return {"ok": True, "status": status_mp}


def _handle_authorized_payment(db: Session, auth_payment_id: str) -> Dict[str, Any]:
    """
    Processa pagamento recorrente autorizado (renovação mensal).
    Quando o MP cobra automaticamente, ele envia este evento.
    """
    resp = requests.get(
        f"{MP_BASE}/authorized_payments/{auth_payment_id}",
        headers=_headers(), timeout=30,
    )
    if resp.status_code != 200:
        return {"ok": False, "reason": "fetch_failed"}

    data = resp.json()
    preapproval_id = data.get("preapproval_id")
    if not preapproval_id:
        return {"ok": False, "reason": "no_preapproval"}

    # Busca a subscription associada
    sub = db.query(Subscription).filter(
        Subscription.payment_provider_id == preapproval_id
    ).first()
    if not sub:
        return {"ok": False, "reason": "sub_not_found"}

    # Renova créditos
    from .subscription_service import PLANOS
    plano_info = PLANOS.get(sub.plan, PLANOS["trial"])
    sub.credits_total = plano_info["creditos_mes"]
    sub.credits_used = 0
    sub.period_start = datetime.utcnow()
    sub.period_end = datetime.utcnow() + timedelta(days=30)
    sub.status = "active"

    db.commit()
    return {"ok": True, "renewed": True}


# ============================================================
# CANCELAMENTO
# ============================================================
def cancel_subscription(db: Session, user: User) -> Subscription:
    """Cancela a assinatura do usuário."""
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        raise ValueError("Assinatura não encontrada.")

    if sub.payment_provider == "mercadopago" and sub.payment_provider_id:
        # Tenta cancelar no MP
        try:
            resp = requests.put(
                f"{MP_BASE}/preapproval/{sub.payment_provider_id}",
                json={"status": "cancelled"},
                headers=_headers(),
                timeout=30,
            )
            # Aceita 200/201 (sucesso). Outros status não bloqueiam o cancelamento local.
            if resp.status_code not in (200, 201, 404):
                print(f"[MP] Aviso ao cancelar: {resp.status_code} - {resp.text[:200]}")
        except Exception as e:
            print(f"[MP] Erro ao cancelar no MP (segue cancelando local): {e}")

    sub.status = "canceled"
    sub.payment_status = "cancelled"
    db.commit()
    db.refresh(sub)
    return sub


# ============================================================
# HISTÓRICO DE COMPRAS
# ============================================================
def get_payment_history(db: Session, user: User, limit: int = 50) -> List[PaymentHistory]:
    return (
        db.query(PaymentHistory)
        .filter(PaymentHistory.user_id == user.id)
        .order_by(PaymentHistory.created_at.desc())
        .limit(limit)
        .all()
    )


def list_packages() -> List[Dict[str, Any]]:
    """Lista os pacotes de créditos avulsos disponíveis."""
    return [
        {
            "codigo": codigo,
            "nome": info["nome"],
            "preco": info["preco"],
            "creditos": info["creditos"],
        }
        for codigo, info in PACOTES_CREDITOS.items()
    ]