from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class SystemSetting(Base):
    """
    Configurações globais do sistema (chave/valor), editáveis pelo super admin.

    Usada para:
      - Ligar/desligar recursos (ex: feature_gerar_imagem_ia)
      - Guardar textos editáveis do sistema (ex: mensagem de recurso indisponível)

    Estrutura puramente aditiva — não interfere em nenhuma tabela existente.

    Campos:
      - chave: identificador único (ex: "feature_gerar_imagem_ia")
      - valor: valor serializado como string (ex: "true", "false", ou texto)
      - tipo: como interpretar o valor ("bool" | "string" | "int" | "json")
      - categoria: agrupamento lógico ("feature_flag" | "texto" | "geral")
      - descricao: texto livre explicando para que serve a chave
      - updated_by: FK users (quem alterou por último)
    """
    __tablename__ = "system_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chave = Column(String(120), nullable=False, unique=True, index=True)
    valor = Column(Text, nullable=False, default="")
    tipo = Column(String(20), nullable=False, default="string")
    categoria = Column(String(50), nullable=False, default="geral", index=True)
    descricao = Column(String(300), nullable=True)

    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())