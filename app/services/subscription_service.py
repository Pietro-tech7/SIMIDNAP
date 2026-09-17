from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from ..models.subscription import Subscription, UsageLog
from ..models.user import User


# ============================================================
# CONFIGURAÇÃO DOS PLANOS
# Créditos armazenados em DÉCIMOS (para permitir 0.2, 0.5, etc.)
# ============================================================
PLANOS = {
    "trial": {
        "nome": "Trial (Grátis)",
        "preco": 0,
        "creditos_mes": 50,  # 5.0 créditos
    },
    "basico": {
        "nome": "Básico",
        "preco": 9.90,
        "creditos_mes": 150,  # 15.0 créditos
    },
    "padrao": {
        "nome": "Padrão",
        "preco": 19.90,
        "creditos_mes": 250,  # 25.0 créditos
    },
    "avancado": {
        "nome": "Avançado",
        "preco": 49.90,
        "creditos_mes": 1000,  # 100.0 créditos
    },
}

# Custo de cada operação em DÉCIMOS de crédito
CUSTOS = {
    "neuroaula": 10,               # 1.0 crédito
    "aula_que_funciona": 10,       # 1.0 crédito
    "atividade_imprimivel": 10,    # 1.0 crédito
    "jogo_dinamica": 10,           # 1.0 crédito
    "simulado": 10,                # 1.0 crédito
    "material_diferenciado": 20,   # 2.0 créditos (quando diferenciado=True)
    "chat_message": 2,             # 0.2 crédito por mensagem de chat
    "meu_aluno_analyze": 5,        # 0.5 crédito
    "image_generation": 15,        # 1.5 crédito por imagem gerada
}

# Tipos de tarefa que têm versão diferenciada
TIPOS_COM_DIFERENCIADO = (
    "neuroaula",
    "aula_que_funciona",
    "atividade_imprimivel",
    "jogo_dinamica",
    "simulado",
)


# ============================================================
# FUNÇÕES PRINCIPAIS
# ============================================================
def get_or_create_subscription(db: Session, user_id: str) -> Subscription:
    """Retorna a subscription do usuário, criando uma trial se não existir."""
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if sub:
        return sub

    # Cria nova subscription trial
    plano = PLANOS["trial"]
    sub = Subscription(
        user_id=user_id,
        plan="trial",
        status="active",
        credits_total=plano["creditos_mes"],
        credits_used=0,
        period_start=datetime.utcnow(),
        period_end=datetime.utcnow() + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _resetar_se_novo_ciclo(db: Session, sub: Subscription) -> Subscription:
    """Verifica se o ciclo mensal expirou e reseta os créditos."""
    if sub.period_end and datetime.utcnow() >= sub.period_end:
        # Renova o ciclo
        sub.credits_used = 0
        sub.period_start = datetime.utcnow()
        sub.period_end = datetime.utcnow() + timedelta(days=30)
        # Se era trial, muda para expired
        if sub.plan == "trial":
            sub.status = "expired"
        db.commit()
        db.refresh(sub)
    return sub


def verificar_creditos(db: Session, user_id: str, task_type: str, diferenciado: bool = False) -> Tuple[bool, int]:
    """
    Verifica se o usuário tem créditos suficientes.
    Retorna (pode_usar, custo_em_decimos).
    """
    sub = get_or_create_subscription(db, user_id)
    sub = _resetar_se_novo_ciclo(db, sub)

    if sub.status != "active":
        return False, 0

    # Calcula o custo
    if diferenciado and task_type in TIPOS_COM_DIFERENCIADO:
        custo = CUSTOS["material_diferenciado"]
    else:
        custo = CUSTOS.get(task_type, 0)

    if custo == 0:
        return True, 0

    # Verifica se tem crédito suficiente
    disponivel = sub.credits_total - sub.credits_used
    return disponivel >= custo, custo


def consumir_creditos(db: Session, user_id: str, task_type: str, custo: int) -> None:
    """Registra o consumo de créditos e cria log de uso."""
    sub = get_or_create_subscription(db, user_id)
    sub.credits_used += custo
    db.add(UsageLog(
        user_id=user_id,
        task_type=task_type,
        credits_consumed=custo,
    ))
    db.commit()


def info_assinatura(db: Session, user_id: str) -> Dict[str, Any]:
    """Retorna informações completas sobre a assinatura do usuário."""
    sub = get_or_create_subscription(db, user_id)
    sub = _resetar_se_novo_ciclo(db, sub)

    plano = PLANOS.get(sub.plan, PLANOS["trial"])
    disponivel = sub.credits_total - sub.credits_used

    return {
        "plano": sub.plan,
        "plano_nome": plano["nome"],
        "plano_preco": plano["preco"],
        "status": sub.status,
        "creditos_total": sub.credits_total / 10,
        "creditos_usados": sub.credits_used / 10,
        "creditos_disponiveis": max(0, disponivel) / 10,
        "periodo_inicio": sub.period_start.isoformat() if sub.period_start else None,
        "periodo_fim": sub.period_end.isoformat() if sub.period_end else None,
    }


def trocar_plano(db: Session, user_id: str, novo_plano: str) -> Subscription:
    """Troca o plano do usuário. No MVP é mock (sem pagamento real)."""
    if novo_plano not in PLANOS:
        raise ValueError(f"Plano inválido: {novo_plano}")

    sub = get_or_create_subscription(db, user_id)
    plano = PLANOS[novo_plano]

    sub.plan = novo_plano
    sub.status = "active"
    sub.credits_total = plano["creditos_mes"]
    sub.credits_used = 0
    sub.period_start = datetime.utcnow()
    sub.period_end = datetime.utcnow() + timedelta(days=30)

    db.commit()
    db.refresh(sub)
    return sub


def listar_planos() -> list:
    """Retorna a lista de planos disponíveis."""
    return [
        {
            "codigo": codigo,
            "nome": info["nome"],
            "preco": info["preco"],
            "creditos_mes": info["creditos_mes"] / 10,
        }
        for codigo, info in PLANOS.items()
    ]