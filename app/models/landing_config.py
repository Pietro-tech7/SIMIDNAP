from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class LandingConfig(Base):
    """
    Configuração dinâmica da landing page (single row).

    Toda a configuração é guardada em um único campo JSONB (`config`),
    permitindo flexibilidade total para o admin editar textos, ativar
    seções, reordenar blocos, adicionar pop-ups, etc — sem precisar
    de migrations.
    """
    __tablename__ = "landing_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config = Column(JSONB, nullable=False, default=dict)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())