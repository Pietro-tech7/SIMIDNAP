"""
Serviço de integração com o Mercado Pago.

Modos suportados:
1. Checkout Transparente (Pix) — QR Code gerado dentro do SIMIDNAPE
2. Checkout Pro (Cartão/Débito) — redireciona para o MP (via preapproval)
3. Webhook — recebe notificações e adiciona créditos/ativa assinaturas

Credenciais (env):
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_PUBLIC_KEY
"""

import os
import time
import uuid
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

PLANOS_PRECOS = {
    "basico": 9.90,
    "padrao": 19.90,
    "avancado": 49.90,
}

PACOTES_CREDITOS = {
    "pack_5":  {"creditos": 5,  "preco": 4.90,  "nome": "5 créditos"},
    "pack_10": {"creditos": 10, "preco": 12.90, "nome": "10 créditos"},
    "pack_25": {"creditos": 25, "preco": 24.90, "nome": "25 créditos"},
}


# ============================================================
# HELPERS
# ============================================================
def _headers() -> Dict[str, str]:
    """Headers padrão (GET, consultas)."""
    token = os.getenv("MERCADOPAGO_ACCESS_TOKEN")
    if not token:
        raise Exception("MERCADOPAGO_ACCESS_TOKEN não configurado.")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _headers_post() -> Dict[str, str]:
    """
    Headers para POST (criação de pagamento/preferência/assinatura).
    Inclui o X-Idempotency-Key obrigatório para evitar duplicidade.
    """
    headers = _headers()
    headers["X-Idempotency-Key"] = str(uuid.uuid4())
    return headers


def _montar_external_reference(user_id: str, tipo: str, item: str) -> str:
    return f"{user_id}|{tipo}|{item}|{int(time.time())}"


def _parse_external_reference(ref: str) -> Dict[str, Optional[str]]:
    partes = (ref or "").split("|")
    return {
        "user_id": partes[0] if len(partes) > 0 else None,
        "tipo":    partes[1] if len(partes) > 1 else None,
        "item":    partes[2] if len(partes) > 2 else None,
    }


# ============================================================
# PIX — ASSINATURA (Checkout Transparente)
# ============================================================
def create_pix_subscription(db: Session, user: User, plan: str) -> Dict[str, Any]:
    """
    Cria um pagamento Pix para assinatura mensal.
    Retorna os dados do QR Code (base64 + copia-cola) para o frontend renderizar.
    """
    if plan not in PLANOS_PRECOS:
        raise ValueError(f"Plano inválido: {plan}")

    preco = PLANOS_PRECOS[plan]
    ext_ref = _montar_external_reference(str(user.id), "subscription", plan)

    body = {
        "transaction_amount": float(preco),
        "description": f"SIMIDNAPE PRO - Plano {plan.capitalize()}",
        "payment_method_id": "pix",
        "payer": {"email": user.email},
        "external_reference": ext_ref,
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "statement_descriptor": "SIMIDNAPE",
    }

    resp = requests.post(f"{MP_BASE}/v1/payments", json=body, headers=_headers_post(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()
    pix_data = (data.get("point_of_interaction") or {}).get("transaction_data") or {}

    # Salva a intenção no banco
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(user_id=user.id, plan="trial", status="active",
                            credits_total=50, credits_used=0)
        db.add(sub)
        db.flush()

    sub.payment_provider = "mercadopago"
    sub.payment_provider_id = str(data.get("id"))
    sub.payment_method = "pix"
    sub.payment_status = data.get("status")
    sub.external_reference = ext_ref
    sub.payment_metadata = data
    db.commit()

    return {
        "payment_id": str(data.get("id")),
        "status": data.get("status"),
        "qr_code_base64": pix_data.get("qr_code_base64"),
        "qr_code": pix_data.get("qr_code"),
        "external_reference": ext_ref,
        "valor": preco,
        "tipo": "subscription",
        "item": plan,
    }


# ============================================================
# PIX — CRÉDITOS AVULSOS (Checkout Transparente)
# ============================================================
def create_pix_credits(db: Session, user: User, package: str) -> Dict[str, Any]:
    """Cria um pagamento Pix para compra de créditos avulsos."""
    if package not in PACOTES_CREDITOS:
        raise ValueError(f"Pacote inválido: {package}")

    pacote = PACOTES_CREDITOS[package]
    ext_ref = _montar_external_reference(str(user.id), "credits", package)

    body = {
        "transaction_amount": float(pacote["preco"]),
        "description": f"SIMIDNAPE PRO - {pacote['nome']}",
        "payment_method_id": "pix",
        "payer": {"email": user.email},
        "external_reference": ext_ref,
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "statement_descriptor": "SIMIDNAPE",
    }

    resp = requests.post(f"{MP_BASE}/v1/payments", json=body, headers=_headers_post(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()
    pix_data = (data.get("point_of_interaction") or {}).get("transaction_data") or {}

    # Salva a intenção no PaymentHistory
    hist = PaymentHistory(
        user_id=user.id,
        payment_provider="mercadopago",
        payment_provider_id=str(data.get("id")),
        external_reference=ext_ref,
        amount=int(pacote["preco"] * 100),
        credits_added=pacote["creditos"] * 10,
        status=data.get("status") or "pending",
        payment_method="pix",
        payment_data=data,
    )
    db.add(hist)
    db.commit()

    return {
        "payment_id": str(data.get("id")),
        "status": data.get("status"),
        "qr_code_base64": pix_data.get("qr_code_base64"),
        "qr_code": pix_data.get("qr_code"),
        "external_reference": ext_ref,
        "valor": pacote["preco"],
        "tipo": "credits",
        "item": package,
    }


# ============================================================
# CONSULTAR STATUS DO PAGAMENTO (para polling)
# ============================================================
def get_payment_status(db: Session, user: User, payment_id: str) -> Dict[str, Any]:
    """
    Consulta o status de um pagamento no MP.
    Usado pelo frontend para fazer polling enquanto o Pix não é confirmado.
    """
    resp = requests.get(f"{MP_BASE}/v1/payments/{payment_id}", headers=_headers(), timeout=30)
    if resp.status_code != 200:
        raise Exception(f"Erro ao consultar pagamento: {resp.status_code}")

    data = resp.json()
    status = data.get("status")  # pending, approved, rejected, cancelled

    # Se aprovado, garantir que os créditos estão adicionados (idempotente)
    if status == "approved":
        ext_ref = data.get("external_reference", "")
        info = _parse_external_reference(ext_ref)

        if info["tipo"] == "credits":
            hist = db.query(PaymentHistory).filter(
                PaymentHistory.external_reference == ext_ref
            ).first()
            if hist and hist.status != "approved":
                hist.status = "approved"
                hist.payment_provider_id = str(payment_id)
                sub = db.query(Subscription).filter(Subscription.user_id == hist.user_id).first()
                if sub:
                    sub.credits_total += hist.credits_added
                    db.add(UsageLog(
                        user_id=hist.user_id,
                        task_type=f"purchase_{info['item'] or 'credits'}",
                        credits_consumed=-hist.credits_added,
                    ))
                db.commit()

        elif info["tipo"] == "subscription":
            sub = db.query(Subscription).filter(
                Subscription.external_reference == ext_ref
            ).first()
            if sub and sub.status != "active":
                plan = info["item"] or "basico"
                from .subscription_service import PLANOS
                if plan in PLANOS:
                    sub.plan = plan
                    sub.status = "active"
                    sub.payment_status = "authorized"
                    sub.credits_total = PLANOS[plan]["creditos_mes"]
                    sub.credits_used = 0
                    sub.period_start = datetime.utcnow()
                    sub.period_end = datetime.utcnow() + timedelta(days=30)
                db.commit()

    return {
        "payment_id": str(payment_id),
        "status": status,
        "status_detail": data.get("status_detail"),
    }


# ============================================================
# CHECKOUT PRO — ASSINATURA (cartão/débito)
# ============================================================
def create_subscription_checkout(db: Session, user: User, plan: str) -> Dict[str, Any]:
    """Assinatura recorrente via Checkout Pro (redirecionamento)."""
    if plan not in PLANOS_PRECOS:
        raise ValueError(f"Plano inválido: {plan}")

    preco = PLANOS_PRECOS[plan]
    ext_ref = _montar_external_reference(str(user.id), "subscription", plan)

    body = {
        "reason": f"SIMIDNAPE PRO - Plano {plan.capitalize()}",
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": float(preco),
            "currency_id": "BRL",
        },
        "back_url": f"{FRONTEND_URL}/minha-assinatura",
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "payer_email": user.email,
        "external_reference": ext_ref,
        "status": "pending",
    }

    resp = requests.post(f"{MP_BASE}/preapproval", json=body, headers=_headers_post(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(user_id=user.id, plan="trial", status="active",
                            credits_total=50, credits_used=0)
        db.add(sub)
        db.flush()

    sub.payment_provider = "mercadopago"
    sub.payment_provider_id = data.get("id")
    sub.payment_status = "pending"
    sub.external_reference = ext_ref
    sub.payment_metadata = data
    db.commit()

    return {
        "checkout_url": data.get("init_point"),
        "external_reference": ext_ref,
        "provider_id": data.get("id"),
    }


# ============================================================
# CHECKOUT PRO — CRÉDITOS
# ============================================================
def create_credits_checkout(db: Session, user: User, package: str) -> Dict[str, Any]:
    """Créditos avulsos via Checkout Pro (redirecionamento)."""
    if package not in PACOTES_CREDITOS:
        raise ValueError(f"Pacote inválido: {package}")

    pacote = PACOTES_CREDITOS[package]
    ext_ref = _montar_external_reference(str(user.id), "credits", package)

    body = {
        "items": [{
            "title": f"SIMIDNAPE PRO - {pacote['nome']}",
            "description": "Créditos adicionais para uso nos motores de IA.",
            "quantity": 1,
            "unit_price": float(pacote["preco"]),
            "currency_id": "BRL",
        }],
        "payer": {"email": user.email},
        "back_urls": {
            "success": f"{FRONTEND_URL}/minha-assinatura?status=success",
            "failure": f"{FRONTEND_URL}/minha-assinatura?status=failure",
            "pending": f"{FRONTEND_URL}/minha-assinatura?status=pending",
        },
        "auto_return": "approved",
        "external_reference": ext_ref,
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "statement_descriptor": "SIMIDNAPE",
    }

    resp = requests.post(f"{MP_BASE}/checkout/preferences", json=body, headers=_headers_post(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()
    hist = PaymentHistory(
        user_id=user.id,
        payment_provider="mercadopago",
        payment_provider_id=str(data.get("id")),
        external_reference=ext_ref,
        amount=int(pacote["preco"] * 100),
        credits_added=pacote["creditos"] * 10,
        status="pending",
        payment_data=data,
    )
    db.add(hist)
    db.commit()

    return {
        "checkout_url": data.get("init_point"),
        "external_reference": ext_ref,
        "provider_id": str(data.get("id")),
    }


# ============================================================
# WEBHOOK
# ============================================================
def process_webhook(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
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
    resp = requests.get(f"{MP_BASE}/v1/payments/{payment_id}", headers=_headers(), timeout=30)
    if resp.status_code != 200:
        return {"ok": False, "reason": "fetch_payment_failed"}

    data = resp.json()
    ext_ref = data.get("external_reference", "")
    info = _parse_external_reference(ext_ref)
    status_mp = data.get("status")

    # ---- Créditos avulsos ----
    if info["tipo"] == "credits":
        hist = db.query(PaymentHistory).filter(
            PaymentHistory.external_reference == ext_ref
        ).first()
        if not hist:
            return {"ok": False, "reason": "history_not_found"}

        hist.status = status_mp
        hist.payment_provider_id = str(payment_id)
        hist.payment_method = data.get("payment_method_id")

        meta = hist.payment_data or {}
        meta["last_webhook"] = data

        if status_mp == "approved" and not meta.get("_credits_added"):
            sub = db.query(Subscription).filter(Subscription.user_id == hist.user_id).first()
            if sub:
                sub.credits_total += hist.credits_added
                db.add(UsageLog(
                    user_id=hist.user_id,
                    task_type=f"purchase_{info['item'] or 'credits'}",
                    credits_consumed=-hist.credits_added,
                ))
            meta["_credits_added"] = True
        hist.payment_data = meta
        db.commit()
        return {"ok": True, "status": status_mp}

    # ---- Assinatura via Pix ----
    if info["tipo"] == "subscription":
        sub = db.query(Subscription).filter(
            Subscription.external_reference == ext_ref
        ).first()
        if not sub:
            return {"ok": False, "reason": "sub_not_found"}

        sub.payment_status = status_mp
        sub.payment_method = data.get("payment_method_id")

        if status_mp == "approved":
            plan = info["item"] or "basico"
            from .subscription_service import PLANOS
            if plan in PLANOS:
                sub.plan = plan
                sub.status = "active"
                sub.credits_total = PLANOS[plan]["creditos_mes"]
                sub.credits_used = 0
                sub.period_start = datetime.utcnow()
                sub.period_end = datetime.utcnow() + timedelta(days=30)
        db.commit()
        return {"ok": True, "status": status_mp}

    return {"ok": True, "ignored": info["tipo"]}


def _handle_preapproval(db: Session, preapproval_id: str) -> Dict[str, Any]:
    resp = requests.get(f"{MP_BASE}/preapproval/{preapproval_id}", headers=_headers(), timeout=30)
    if resp.status_code != 200:
        return {"ok": False, "reason": "fetch_failed"}

    data = resp.json()
    ext_ref = data.get("external_reference", "")
    info = _parse_external_reference(ext_ref)

    sub = db.query(Subscription).filter(Subscription.external_reference == ext_ref).first()
    if not sub:
        return {"ok": False, "reason": "sub_not_found"}

    status_mp = data.get("status")
    sub.payment_status = status_mp
    sub.payment_provider_id = preapproval_id

    if status_mp == "authorized":
        plan = info["item"] or sub.plan
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
    resp = requests.get(f"{MP_BASE}/authorized_payments/{auth_payment_id}",
                        headers=_headers(), timeout=30)
    if resp.status_code != 200:
        return {"ok": False, "reason": "fetch_failed"}

    data = resp.json()
    preapproval_id = data.get("preapproval_id")
    if not preapproval_id:
        return {"ok": False}

    sub = db.query(Subscription).filter(
        Subscription.payment_provider_id == preapproval_id
    ).first()
    if not sub:
        return {"ok": False}

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
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        raise ValueError("Assinatura não encontrada.")

    if sub.payment_provider == "mercadopago" and sub.payment_provider_id:
        try:
            requests.put(
                f"{MP_BASE}/preapproval/{sub.payment_provider_id}",
                json={"status": "cancelled"},
                headers=_headers(), timeout=30,
            )
        except Exception as e:
            print(f"[MP] Erro ao cancelar no MP: {e}")

    sub.status = "canceled"
    sub.payment_status = "cancelled"
    db.commit()
    db.refresh(sub)
    return sub


# ============================================================
# LISTAGENS
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
    return [
        {
            "codigo": codigo,
            "nome": info["nome"],
            "preco": info["preco"],
            "creditos": info["creditos"],
        }
        for codigo, info in PACOTES_CREDITOS.items()
    ]