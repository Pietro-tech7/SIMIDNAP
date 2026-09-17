from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base

class Reflection(Base):
    __tablename__ = "reflections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    theme = Column(String, nullable=True)  # ex: 'relacao_professor_aluno'
    messages = Column(JSONB, nullable=False, default=list)  # histórico da conversa
    summary = Column(Text, nullable=True)  # resumo gerado ao final
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())