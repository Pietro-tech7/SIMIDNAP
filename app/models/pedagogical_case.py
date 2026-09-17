from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class PedagogicalCase(Base):
    __tablename__ = "pedagogical_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    grade = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    description = Column(Text, nullable=False)

    # Campos de investigação estruturada (todos opcionais)
    frequencia = Column(String, nullable=True)       # "sempre", "às vezes", "raramente", "só em situações específicas"
    situacoes = Column(Text, nullable=True)          # onde/como acontece
    reacao_aluno = Column(Text, nullable=True)       # como o aluno reage
    ja_tentou = Column(Text, nullable=True)          # o que o professor já tentou
    contexto_adicional = Column(Text, nullable=True) # qualquer outra info relevante

    analysis = Column(JSONB, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())