from sqlalchemy import Column, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class ThemeConfig(Base):
    """
    Configuração de TEMA do SIMIDNAPE (single row).

    Guarda cores e fontes em um único campo JSONB (`config`),
    permitindo que o super admin edite toda a identidade visual
    sem precisar de migrations nem deploy.

    Aplicado em:
    - Landing page pública
    - Painel do usuário (área logada)
    - Painel do admin
    """
    __tablename__ = "theme_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    config = Column(JSONB, nullable=False, default=dict)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())