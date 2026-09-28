from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime


# ============================================================
# CHECKOUT DE ASSINATURA
# ============================================================
class CheckoutSubscriptionRequest(BaseModel):
    """Payload para criar uma assinatura (mensal recorrente)."""
    plan: str = Field(..., description="'basico' | 'padrao' | 'vip' | 'avancado'")


class CheckoutResponse(BaseModel):
    """Resposta com a URL de checkout do Mercado Pago."""
    checkout_url: str = Field(..., description="URL para redirecionar o usuário")
    external_reference: str
    provider_id: Optional[str] = None


# ============================================================
# COMPRA DE CRÉDITOS AVULSOS
# ============================================================
class CheckoutCreditsRequest(BaseModel):
    """Payload para comprar créditos avulsos."""
    package: str = Field(
        ...,
        description="'pack_5' (5 créditos), 'pack_10' (10 créditos), 'pack_25' (25 créditos)"
    )


# ============================================================
# CANCELAMENTO
# ============================================================
class CancelSubscriptionRequest(BaseModel):
    """Payload de cancelamento (confirmação)."""
    confirmar: bool = Field(True)


# ============================================================
# STATUS DA ASSINATURA (saída)
# ============================================================
class SubscriptionStatusOut(BaseModel):
    plano: str
    plano_nome: str
    plano_icone: Optional[str] = None
    plano_preco: float
    status: str
    creditos_total: float
    creditos_usados: float
    creditos_disponiveis: float
    tem_api_propria: bool = False
    recursos: List[str] = []
    periodo_inicio: Optional[str] = None
    periodo_fim: Optional[str] = None
    payment_provider: Optional[str] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================
# PLANOS DISPONÍVEIS
# ============================================================
class PlanoOut(BaseModel):
    codigo: str
    nome: str
    icone: str = "📋"
    preco: float
    creditos_mes: float = 0          # legado (sem API)
    creditos_sem_api: float = 0
    creditos_com_api: float = 0
    destaque: bool = False
    recursos: List[str] = []


# ============================================================
# PACOTES DE CRÉDITOS AVULSOS
# ============================================================
class PacoteCreditosOut(BaseModel):
    codigo: str
    nome: str
    preco: float
    creditos: float


# ============================================================
# HISTÓRICO DE COMPRAS
# ============================================================
class PaymentHistoryItem(BaseModel):
    id: UUID
    payment_provider_id: Optional[str]
    amount: float
    credits_added: float
    status: str
    payment_method: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True