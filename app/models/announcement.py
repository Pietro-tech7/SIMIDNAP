from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Autor do recado (superusuário)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Destinatário (nulo = para todos)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    # Tipo: info, aviso, sucesso
    tipo = Column(String, nullable=False, default="info")
    # Se o destinatário já leu (só relevante para individuais)
    read = Column(Boolean, nullable=False, default=False)
    # Ativo/inativo (admin pode desativar antes do prazo)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())