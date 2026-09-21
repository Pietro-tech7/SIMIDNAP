from sqlalchemy import Column, String, DateTime, Integer, LargeBinary, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class LandingAsset(Base):
    """
    Armazena imagens enviadas pelo admin para a landing page.

    Cada imagem é identificada por um `slot` (nome do campo):
    - 'hero_image', 'bg_image' — Hero
    - 'problem_image' — Problema
    - 'solution_image' — Solução
    - 'founder_photo' — Founder
    - 'testimonials_image' — Depoimentos
    - 'faq_image' — FAQ

    Ao subir uma nova imagem no mesmo slot, a anterior é substituída.
    A imagem é servida em GET /api/v1/landing/image/{id}.
    """
    __tablename__ = "landing_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot = Column(String, nullable=False, unique=True, index=True)
    filename = Column(String, nullable=True)
    mime_type = Column(String, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    data = Column(LargeBinary, nullable=False)  # bytea no PostgreSQL
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())