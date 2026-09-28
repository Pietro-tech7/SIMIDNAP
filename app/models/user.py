from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    gemini_api_key = Column(String, nullable=True)
    # Chave do Gemini do usuário — armazenada CRIPTOGRAFADA (Fernet + SECRET_KEY).
    # Quando presente, o sistema usa essa chave em vez da chave global.
    # Nunca é retornada em texto puro pela API — sempre mascarada.

    data_cadastro_api = Column(DateTime, nullable=True)
    # Data em que o usuário cadastrou a própria chave. NULL = ainda usa a do sistema.
    # Usada para métricas do super admin (quantos ainda não cadastraram).

    avatar_url = Column(String, nullable=True)

    # ============================================================
    # LOCALIZAÇÃO E REDE DE ENSINO
    # ============================================================
    estado = Column(String(2), nullable=True, index=True)   # UF: 'PI', 'MA', 'SP', ...
    rede = Column(String(20), nullable=True, index=True)    # 'estadual' | 'municipal' | 'privada' | 'outro'

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    @property
    def tem_gemini_key(self) -> bool:
        """Retorna True se o usuário tem a própria chave do Gemini cadastrada.
        Propriedade calculada — não é coluna do banco."""
        return bool(self.gemini_api_key)