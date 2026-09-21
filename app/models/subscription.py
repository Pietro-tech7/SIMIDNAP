from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    plan = Column(String, nullable=False, default="trial")  # trial, basico, padrao, avancado
    status = Column(String, nullable=False, default="active")  # active, canceled, expired, pending
    credits_total = Column(Integer, nullable=False, default=50)  # em décimos (50 = 5.0 créditos)
    credits_used = Column(Integer, nullable=False, default=0)
    period_start = Column(DateTime, server_default=func.now())
    period_end = Column(DateTime, nullable=True)

    # ============================================================
    # MERCADO PAGO — Integração com gateway
    # ============================================================
    payment_provider = Column(String, nullable=True)         # 'mercadopago'
    payment_provider_id = Column(String, nullable=True)      # preapproval_id (assinatura) ou payment_id (compra avulsa)
    payment_method = Column(String, nullable=True)           # 'pix', 'credit_card', 'debit_card'
    payment_status = Column(String, nullable=True)           # 'pending', 'authorized', 'paused', 'cancelled', 'rejected'
    external_reference = Column(String, nullable=True, index=True)  # Referência única (user_id + timestamp)
    payment_metadata = Column(JSONB, nullable=True)          # Dados completos do MP (auditoria)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    task_type = Column(String, nullable=False)  # 'neuroaula', 'simulado', 'chat', 'purchase_credits', etc
    credits_consumed = Column(Integer, nullable=False)  # em décimos (2 = 0.2 créditos; negativo para compras)
    created_at = Column(DateTime, server_default=func.now(), index=True)


class PaymentHistory(Base):
    """
    Histórico de compras de créditos avulsos (não recorrentes).
    Cada compra adiciona créditos ao plano do usuário.
    """
    __tablename__ = "payment_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    payment_provider = Column(String, nullable=False, default="mercadopago")
    payment_provider_id = Column(String, nullable=True, index=True)  # payment_id do MP
    external_reference = Column(String, nullable=True, index=True)
    amount = Column(Integer, nullable=False)              # valor em centavos (ex: 490 = R$ 4,90)
    credits_added = Column(Integer, nullable=False)       # em décimos (ex: 50 = 5.0 créditos)
    status = Column(String, nullable=False, default="pending")  # 'pending', 'approved', 'rejected'
    payment_method = Column(String, nullable=True)        # 'pix', 'credit_card', 'debit_card'
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())