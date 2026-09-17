from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)
    plan = Column(String, nullable=False, default="trial")  # trial, basico, padrao, avancado
    status = Column(String, nullable=False, default="active")  # active, canceled, expired
    credits_total = Column(Integer, nullable=False, default=50)  # em décimos (50 = 5.0 créditos)
    credits_used = Column(Integer, nullable=False, default=0)
    period_start = Column(DateTime, server_default=func.now())
    period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    task_type = Column(String, nullable=False)  # 'neuroaula', 'simulado', 'chat', etc
    credits_consumed = Column(Integer, nullable=False)  # em décimos (2 = 0.2 créditos)
    created_at = Column(DateTime, server_default=func.now(), index=True)