from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timedelta
from ..models.subscription import Subscription, UsageLog
from ..models.user import User


# ============================================================
# RECURSOS DISPONÍVEIS NO SISTEMA
# Chaves usadas pelo frontend para gate visual.
# ============================================================
RECURSO_NEUROAULA = "neuroaula"
RECURSO_AULA_QUE_FUNCIONA = "aula_que_funciona"
RECURSO_TERAPIA = "terapia"
RECURSO_MEU_ALUNO = "meu_aluno"
RECURSO_MATERIAIS = "materiais"
RECURSO_PRATICAS = "praticas"
RECURSO_BANCO_ENEM = "banco_enem"
RECURSO_BANCO_FUNDAMENTAL = "banco_fundamental"
RECURSO_BANCO_IA = "banco_ia"
RECURSO_EXPORT_PDF = "export_pdf"
RECURSO_EXPORT_WORD = "export_word"
RECURSO_PLANEJAMENTO = "planejamento"
RECURSO_IMAGENS_IA = "imagens_ia"

RECURSOS_TODOS = [
    RECURSO_NEUROAULA, RECURSO_AULA_QUE_FUNCIONA, RECURSO_TERAPIA,
    RECURSO_MEU_ALUNO, RECURSO_MATERIAIS, RECURSO_PRATICAS,
    RECURSO_BANCO_ENEM, RECURSO_BANCO_FUNDAMENTAL, RECURSO_BANCO_IA,
    RECURSO_EXPORT_PDF, RECURSO_EXPORT_WORD,
    RECURSO_PLANEJAMENTO, RECURSO_IMAGENS_IA,
]

RECURSOS_BASICO = [
    RECURSO_NEUROAULA, RECURSO_AULA_QUE_FUNCIONA, RECURSO_TERAPIA,
    RECURSO_MEU_ALUNO, RECURSO_MATERIAIS, RECURSO_PRATICAS,
    RECURSO_BANCO_ENEM, RECURSO_BANCO_FUNDAMENTAL, RECURSO_EXPORT_PDF,
]

RECURSOS_INTERMEDIARIO = RECURSOS_BASICO + [RECURSO_BANCO_IA, RECURSO_EXPORT_WORD]
RECURSOS_VIP = RECURSOS_INTERMEDIARIO + [RECURSO_PLANEJAMENTO]
RECURSOS_PREMIUM = RECURSOS_VIP + [RECURSO_IMAGENS_IA]


# ============================================================
# CONFIGURAÇÃO DOS PLANOS
# Créditos em DÉCIMOS (1 crédito = 10 décimos)
#
# Chave "creditos_mes" mantida para retrocompatibilidade com
# payment_service.py — aponta para creditos_sem_api.
# ============================================================
PLANOS = {
    "trial": {
        "nome": "Grátis",
        "icone": "🎁",
        "preco": 0,
        "creditos_mes": 70,        # legado
        "creditos_sem_api": 70,    # 7.0 créditos
        "creditos_com_api": 70,    # trial não muda com API
        "recursos": RECURSOS_TODOS,
        "destaque": False,
    },
    "basico": {
        "nome": "Básico",
        "icone": "🎒",
        "preco": 9.90,
        "creditos_mes": 150,
        "creditos_sem_api": 150,    # 15.0 créditos
        "creditos_com_api": 500,    # 50.0 créditos
        "recursos": RECURSOS_BASICO,
        "destaque": False,
    },
    "padrao": {
        "nome": "Intermediário",
        "icone": "🚀",
        "preco": 19.90,
        "creditos_mes": 250,
        "creditos_sem_api": 250,    # 25.0 créditos
        "creditos_com_api": 1500,   # 150.0 créditos
        "recursos": RECURSOS_INTERMEDIARIO,
        "destaque": True,
    },
    "vip": {
        "nome": "VIP",
        "icone": "💎",
        "preco": 29.90,
        "creditos_mes": 500,
        "creditos_sem_api": 500,    # 50.0 créditos
        "creditos_com_api": 5000,   # 500.0 créditos
        "recursos": RECURSOS_VIP,
        "destaque": False,
    },
    "avancado": {
        "nome": "Premium",
        "icone": "👑",
        "preco": 44.90,
        "creditos_mes": 1000,
        "creditos_sem_api": 1000,   # 100.0 créditos
        "creditos_com_api": 10000,  # 1000.0 créditos
        "recursos": RECURSOS_PREMIUM,
        "destaque": False,
    },
}

# Custo de cada operação em DÉCIMOS de crédito
CUSTOS = {
    "neuroaula": 10,
    "aula_que_funciona": 10,
    "atividade_imprimivel": 10,
    "jogo_dinamica": 10,
    "simulado": 10,
    "material_diferenciado": 20,
    "chat_message": 2,
    "meu_aluno_analyze": 5,
    "image_generation": 15,
    "pratica_exitosa": 30,
    "simulado_banco": 10,
}

TIPOS_COM_DIFERENCIADO = (
    "neuroaula",
    "aula_que_funciona",
    "atividade_imprimivel",
    "jogo_dinamica",
    "simulado",
)


# ============================================================
# HELPERS INTERNOS
# ============================================================
def _creditos_esperados(plano_codigo: str, tem_api: bool) -> int:
    """Retorna a quantidade de créditos (em décimos) esperada para o plano."""
    plano = PLANOS.get(plano_codigo)
    if not plano:
        return 0
    return plano["creditos_com_api"] if tem_api else plano["creditos_sem_api"]


def _tem_api_propria(user: Optional[User]) -> bool:
    """Retorna True se o usuário tem chave do Gemini cadastrada."""
    return bool(user and getattr(user, "gemini_api_key", None))


def _sincronizar_creditos(
    db: Session,
    sub: Subscription,
    user: Optional[User],
) -> Subscription:
    """
    Se `credits_total` não bate com o esperado (plano + status da API),
    atualiza silenciosamente. Não mexe em `credits_used`.
    Trial não é sincronizado (tem seu próprio valor na criação).
    """
    if sub.plan == "trial":
        return sub
    if not user:
        return sub

    tem_api = _tem_api_propria(user)
    esperado = _creditos_esperados(sub.plan, tem_api)

    if esperado > 0 and sub.credits_total != esperado:
        sub.credits_total = esperado
        db.commit()
        db.refresh(sub)

    return sub


# ============================================================
# FUNÇÕES PRINCIPAIS
# ============================================================
def get_or_create_subscription(db: Session, user_id: str) -> Subscription:
    """Retorna a subscription do usuário, criando uma trial se não existir."""
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if sub:
        return sub

    plano = PLANOS["trial"]
    sub = Subscription(
        user_id=user_id,
        plan="trial",
        status="active",
        credits_total=plano["creditos_sem_api"],
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
        sub.credits_used = 0
        sub.period_start = datetime.utcnow()
        sub.period_end = datetime.utcnow() + timedelta(days=30)
        if sub.plan == "trial":
            sub.status = "expired"
        db.commit()
        db.refresh(sub)
    return sub


def verificar_creditos(
    db: Session,
    user_id: str,
    task_type: str,
    diferenciado: bool = False,
) -> Tuple[bool, int]:
    """Verifica se o usuário tem créditos suficientes. Retorna (pode_usar, custo)."""
    sub = get_or_create_subscription(db, user_id)
    sub = _resetar_se_novo_ciclo(db, sub)

    if sub.status != "active":
        return False, 0

    if diferenciado and task_type in TIPOS_COM_DIFERENCIADO:
        custo = CUSTOS["material_diferenciado"]
    else:
        custo = CUSTOS.get(task_type, 0)

    if custo == 0:
        return True, 0

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
    """
    Retorna informações completas sobre a assinatura do usuário.
    Sincroniza `credits_total` com base no plano + status da API própria.
    """
    sub = get_or_create_subscription(db, user_id)
    user = db.query(User).filter(User.id == user_id).first()

    sub = _resetar_se_novo_ciclo(db, sub)
    sub = _sincronizar_creditos(db, sub, user)

    plano = PLANOS.get(sub.plan, PLANOS["trial"])
    disponivel = sub.credits_total - sub.credits_used
    tem_api = _tem_api_propria(user)

    return {
        "plano": sub.plan,
        "plano_nome": plano["nome"],
        "plano_icone": plano["icone"],
        "plano_preco": plano["preco"],
        "status": sub.status,
        "creditos_total": sub.credits_total / 10,
        "creditos_usados": sub.credits_used / 10,
        "creditos_disponiveis": max(0, disponivel) / 10,
        "tem_api_propria": tem_api,
        "recursos": plano["recursos"],
        "periodo_inicio": sub.period_start.isoformat() if sub.period_start else None,
        "periodo_fim": sub.period_end.isoformat() if sub.period_end else None,
        "payment_provider": getattr(sub, "payment_provider", None),
        "payment_method": getattr(sub, "payment_method", None),
        "payment_status": getattr(sub, "payment_status", None),
    }


def trocar_plano(db: Session, user_id: str, novo_plano: str) -> Subscription:
    """Troca o plano do usuário. Ajusta créditos conforme o novo plano + API."""
    if novo_plano not in PLANOS:
        raise ValueError(f"Plano inválido: {novo_plano}")

    sub = get_or_create_subscription(db, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    tem_api = _tem_api_propria(user)
    creditos = _creditos_esperados(novo_plano, tem_api)

    sub.plan = novo_plano
    sub.status = "active"
    sub.credits_total = creditos
    sub.credits_used = 0
    sub.period_start = datetime.utcnow()
    sub.period_end = datetime.utcnow() + timedelta(days=30)

    db.commit()
    db.refresh(sub)
    return sub


def listar_planos() -> list:
    """Retorna a lista de planos disponíveis com todos os campos novos."""
    return [
        {
            "codigo": codigo,
            "nome": info["nome"],
            "icone": info["icone"],
            "preco": info["preco"],
            "creditos_mes": info["creditos_sem_api"] / 10,       # legado
            "creditos_sem_api": info["creditos_sem_api"] / 10,
            "creditos_com_api": info["creditos_com_api"] / 10,
            "destaque": info["destaque"],
            "recursos": info["recursos"],
        }
        for codigo, info in PLANOS.items()
    ]


# ============================================================
# RECURSOS POR PLANO (gate visual)
# ============================================================
def verificar_acesso_recurso(db: Session, user_id: str, recurso: str) -> bool:
    """
    Retorna True se o plano ativo do usuário libera o recurso informado.
    Recurso inexistente → False.
    """
    sub = get_or_create_subscription(db, user_id)
    sub = _resetar_se_novo_ciclo(db, sub)

    if sub.status != "active":
        return False

    plano = PLANOS.get(sub.plan)
    if not plano:
        return False

    return recurso in plano["recursos"]


def sincronizar_creditos_usuario(db: Session, user_id: str) -> Subscription:
    """
    Sincroniza os créditos do usuário com base no plano + estado da API própria.
    Chamado após o cadastro da chave em `/users/me/gemini-key`.
    """
    sub = get_or_create_subscription(db, user_id)
    user = db.query(User).filter(User.id == user_id).first()
    return _sincronizar_creditos(db, sub, user)