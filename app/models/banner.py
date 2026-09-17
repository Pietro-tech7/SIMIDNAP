from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class Banner(Base):
    __tablename__ = "banners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    titulo = Column(String, nullable=True)          # título opcional
    texto = Column(String, nullable=False)          # frase principal
    imagem_perfil = Column(String, nullable=True)   # foto pequena ao lado do texto
    tipo_midia = Column(String, nullable=False, default="nenhuma")  # 'nenhuma', 'imagem', 'video', 'embed_instagram', 'embed_tiktok', 'embed_facebook'
    imagem_url = Column(String, nullable=True)      # URL da imagem/vídeo/embed
    link_url = Column(String, nullable=True)        # link de destino ao clicar
    telefone = Column(String, nullable=True)        # telefone ou whatsapp
    ativo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())