from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    material_type = Column(String, nullable=False)  # 'atividade_imprimivel', 'jogo_dinamica', 'simulado'
    title = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    content = Column(String, nullable=True)
    diferenciado = Column(Boolean, default=False, nullable=False)
    structured_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())