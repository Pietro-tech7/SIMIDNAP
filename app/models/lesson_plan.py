from sqlalchemy import Column, String, DateTime, Date, Boolean, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base

class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    plan_type = Column(String, nullable=False)  # 'neuroaula' ou 'aula_que_funciona'
    title = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    content = Column(String, nullable=True)
    objective = Column(String, nullable=True)
    structured_data = Column(JSONB, nullable=False)

    # ============================================================
    # Campos novos (Planejador SIMIDNAPE — Bloco D1)
    # Todos opcionais ou com default, para NÃO quebrar planos existentes.
    # O conteúdo de cada modo continua no JSONB `structured_data`.
    # ============================================================
    modo = Column(String(20), nullable=False, server_default="aula", index=True)
    periodo_tipo = Column(String(20), nullable=True, index=True)
    periodo_inicio = Column(Date, nullable=True)
    periodo_fim = Column(Date, nullable=True)
    total_aulas = Column(Integer, nullable=True)
    publico = Column(Boolean, nullable=False, server_default="false", index=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())