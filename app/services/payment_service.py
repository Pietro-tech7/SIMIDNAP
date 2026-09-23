"""
Serviço de integração com o Mercado Pago.

Modos suportados:
1. Checkout Transparente (Pix) — QR Code gerado dentro do SIMIDNAPE
2. Checkout Transparente (Cartão) — Card Payment Brick + preapproval/payments
3. Webhook — recebe notificações e adiciona créditos/ativa assinaturas

E-mails transacionais (Brevo):
- Confirmação de compra (créditos e assinaturas) — PIX e cartão
- Cancelamento de assinatura

Credenciais (env):
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_PUBLIC_KEY
- BREVO_API_KEY
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
from .email_service import send_purchase_email, send_cancellation_email


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

PLANOS_NOMES = {
    "basico": "Plano Básico",
    "padrao": "Plano Padrão",
    "avancado": "Plano Avançado",
    "trial": "Plano Trial (Grátis)",
}

PACOTES_CREDITOS = {
    "pack_5":  {"creditos": 5,  "preco": 4.90,  "nome": "5 créditos"},
    "pack_10": {"creditos": 10, "preco": 12.90, "nome": "10 créditos"},
    "pack_25": {"creditos": 25, "preco": 24.90, "nome": "25 créditos"},
}


# ============================================================
# HELPERS — HEADERS HTTP
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


# ============================================================
# HELPERS — EXTERNAL REFERENCE
# ============================================================
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
# HELPERS — E-MAIL (idempotência)
# ============================================================
def _enviar_email_creditos(db: Session, hist: PaymentHistory) -> None:
    """
    Envia e-mail de confirmação para compra de CRÉDITOS avulsos.
    Idempotente: usa flag `_email_sent` no payment_data.
    """
    try:
        meta = hist.payment_data or {}
        if meta.get("_email_sent"):
            return

        user = db.query(User).filter(User.id == hist.user_id).first()
        if not user:
            return

        info = _parse_external_reference(hist.external_reference or "")
        package = info.get("item") or "credits"
        pacote_info = PACOTES_CREDITOS.get(package, {})
        nome_produto = pacote_info.get("nome", "Créditos")
        creditos = (hist.credits_added or 0) / 10.0

        enviado = send_purchase_email(
            email=user.email,
            nome=user.full_name or user.email,
            produto=nome_produto,
            valor=(hist.amount or 0) / 100.0,
            metodo=hist.payment_method or "pix",
            creditos_adicionados=creditos,
            tipo="credits",
        )
        if enviado:
            meta["_email_sent"] = True
            hist.payment_data = meta
            db.commit()
    except Exception as e:
        print(f"[Email] Falha ao enviar confirmação de créditos: {e}")


def _enviar_email_assinatura(db: Session, sub: Subscription) -> None:
    """
    Envia e-mail de confirmação para ASSINATURA ativada.
    Idempotente: usa o external_reference como chave em payment_metadata.
    Isso permite reenvio em renovações futuras (novo external_reference).
    """
    try:
        meta = sub.payment_metadata or {}
        ext_ref = sub.external_reference or ""
        if meta.get("_last_email_ref") == ext_ref:
            return

        user = db.query(User).filter(User.id == sub.user_id).first()
        if not user:
            return

        plano = sub.plan or "basico"
        nome_produto = PLANOS_NOMES.get(plano, f"Plano {plano.capitalize()}")
        valor = PLANOS_PRECOS.get(plano, 0.0)

        enviado = send_purchase_email(
            email=user.email,
            nome=user.full_name or user.email,
            produto=nome_produto,
            valor=valor,
            metodo=sub.payment_method or "pix",
            creditos_adicionados=None,
            tipo="subscription",
        )
        if enviado:
            meta["_last_email_ref"] = ext_ref
            sub.payment_metadata = meta
            db.commit()
    except Exception as e:
        print(f"[Email] Falha ao enviar confirmação de assinatura: {e}")


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

                # 📧 E-mail de confirmação (idempotente)
                _enviar_email_creditos(db, hist)

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

                # 📧 E-mail de confirmação (idempotente)
                _enviar_email_assinatura(db, sub)

    return {
        "payment_id": str(payment_id),
        "status": status,
        "status_detail": data.get("status_detail"),
    }


# ============================================================
# CHECKOUT PRO — ASSINATURA (cartão/débito) — legado, mantido por segurança
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
# CHECKOUT PRO — CRÉDITOS — legado, mantido por segurança
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

        # 📧 E-mail de confirmação (idempotente)
        if status_mp == "approved":
            _enviar_email_creditos(db, hist)

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

        # 📧 E-mail de confirmação (idempotente)
        if status_mp == "approved":
            _enviar_email_assinatura(db, sub)

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

    # 📧 E-mail de confirmação (idempotente)
    if status_mp == "authorized":
        _enviar_email_assinatura(db, sub)

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

    # Renovação: novo external_reference para permitir novo e-mail
    sub.external_reference = _montar_external_reference(
        str(sub.user_id), "subscription", sub.plan or "basico"
    )
    db.commit()

    # 📧 E-mail de confirmação de renovação
    _enviar_email_assinatura(db, sub)

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

    plano_anterior = sub.plan or "basico"
    sub.status = "canceled"
    sub.payment_status = "cancelled"
    db.commit()
    db.refresh(sub)

    # 📧 E-mail de cancelamento (não idempotente — só dispara em ação do usuário)
    try:
        nome_plano = PLANOS_NOMES.get(plano_anterior, f"Plano {plano_anterior.capitalize()}")
        send_cancellation_email(
            email=user.email,
            nome=user.full_name or user.email,
            plano=nome_plano,
        )
    except Exception as e:
        print(f"[Email] Falha ao enviar cancelamento: {e}")

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


# ============================================================
# CARTÃO DE CRÉDITO — CRÉDITOS AVULSOS (Checkout Transparente)
# ============================================================
def create_card_credits(db: Session, user: User, package: str, card_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cria um pagamento com cartão de crédito para compra de créditos avulsos.
    O card_data vem do Card Payment Brick (token, payment_method_id, etc).
    """
    if package not in PACOTES_CREDITOS:
        raise ValueError(f"Pacote inválido: {package}")

    pacote = PACOTES_CREDITOS[package]
    ext_ref = _montar_external_reference(str(user.id), "credits", package)

    token = card_data.get("token")
    payment_method_id = card_data.get("payment_method_id")
    if not token:
        raise ValueError("Token do cartão ausente.")
    if not payment_method_id:
        raise ValueError("payment_method_id ausente.")

    installments = int(card_data.get("installments") or 1)
    issuer_id = card_data.get("issuer_id")
    payer_data = card_data.get("payer") or {}

    payer: Dict[str, Any] = {"email": user.email}
    identification = payer_data.get("identification")
    if identification:
        payer["identification"] = identification

    body: Dict[str, Any] = {
        "transaction_amount": float(pacote["preco"]),
        "token": token,
        "description": f"SIMIDNAPE PRO - {pacote['nome']}",
        "installments": installments,
        "payment_method_id": payment_method_id,
        "payer": payer,
        "external_reference": ext_ref,
        "notification_url": f"{BACKEND_URL}/api/v1/subscriptions/webhook",
        "statement_descriptor": "SIMIDNAPE",
    }
    if issuer_id:
        body["issuer_id"] = str(issuer_id)

    resp = requests.post(f"{MP_BASE}/v1/payments", json=body, headers=_headers_post(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()
    status_mp = data.get("status") or "pending"

    hist = PaymentHistory(
        user_id=user.id,
        payment_provider="mercadopago",
        payment_provider_id=str(data.get("id")),
        external_reference=ext_ref,
        amount=int(pacote["preco"] * 100),
        credits_added=pacote["creditos"] * 10,
        status=status_mp,
        payment_method="credit_card",
        payment_data=data,
    )
    db.add(hist)

    # Se aprovado na hora, adiciona créditos imediatamente
    if status_mp == "approved":
        meta = hist.payment_data or {}
        if not meta.get("_credits_added"):
            sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
            if sub:
                sub.credits_total += hist.credits_added
                db.add(UsageLog(
                    user_id=user.id,
                    task_type=f"purchase_{package}",
                    credits_consumed=-hist.credits_added,
                ))
            meta["_credits_added"] = True
            hist.payment_data = meta

    db.commit()

    # 📧 E-mail de confirmação (idempotente) se aprovado na hora
    if status_mp == "approved":
        _enviar_email_creditos(db, hist)

    return {
        "payment_id": str(data.get("id")),
        "status": status_mp,
        "status_detail": data.get("status_detail"),
        "external_reference": ext_ref,
        "valor": pacote["preco"],
        "tipo": "credits",
        "item": package,
    }


# ============================================================
# CARTÃO DE CRÉDITO — ASSINATURA (Checkout Transparente via preapproval)
# ============================================================
def create_card_subscription(db: Session, user: User, plan: str, card_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cria uma assinatura recorrente com cartão de crédito (preapproval).
    O card_data vem do Card Payment Brick (token gerado no frontend).
    """
    if plan not in PLANOS_PRECOS:
        raise ValueError(f"Plano inválido: {plan}")

    preco = PLANOS_PRECOS[plan]
    ext_ref = _montar_external_reference(str(user.id), "subscription", plan)

    token = card_data.get("token")
    if not token:
        raise ValueError("Token do cartão ausente.")

    body = {
        "reason": f"SIMIDNAPE PRO - Plano {plan.capitalize()}",
        "external_reference": ext_ref,
        "payer_email": user.email,
        "card_token_id": token,
        "auto_recurring": {
            "frequency": 1,
            "frequency_type": "months",
            "transaction_amount": float(preco),
            "currency_id": "BRL",
        },
        "back_url": f"{FRONTEND_URL}/minha-assinatura",
        "status": "authorized",
    }

    resp = requests.post(f"{MP_BASE}/preapproval", json=body, headers=_headers_post(), timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Erro Mercado Pago ({resp.status_code}): {resp.text}")

    data = resp.json()
    status_mp = data.get("status")

    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(user_id=user.id, plan="trial", status="active",
                           credits_total=50, credits_used=0)
        db.add(sub)
        db.flush()

    sub.payment_provider = "mercadopago"
    sub.payment_provider_id = data.get("id")
    sub.payment_method = "credit_card"
    sub.payment_status = status_mp
    sub.external_reference = ext_ref
    sub.payment_metadata = data

    if status_mp == "authorized":
        from .subscription_service import PLANOS
        if plan in PLANOS:
            sub.plan = plan
            sub.status = "active"
            sub.credits_total = PLANOS[plan]["creditos_mes"]
            sub.credits_used = 0
            sub.period_start = datetime.utcnow()
            sub.period_end = datetime.utcnow() + timedelta(days=30)

    db.commit()

    # 📧 E-mail de confirmação (idempotente)
    if status_mp == "authorized":
        _enviar_email_assinatura(db, sub)

    return {
        "payment_id": data.get("id"),
        "status": status_mp or "pending",
        "status_detail": data.get("status_detail") or status_mp,
        "external_reference": ext_ref,
        "valor": preco,
        "tipo": "subscription",
        "item": plan,
    }