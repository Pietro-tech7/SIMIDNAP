from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, ForeignKey, LargeBinary
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class FigureBank(Base):
    """
    Banco de figuras/ilustrações do sistema (Bloco F).

    Substitui gradualmente os SVGs físicos (frontend/public/icons).
    Cada figura é armazenada diretamente no banco (bytes) — não em pasta.

    Fluxo:
      1. Super admin faz upload (1 ou várias figuras)
      2. IA classifica automaticamente (nome + categoria + keywords)
      3. Super admin revisa/ajusta
      4. Figura fica disponível para todos os professores no Motor 9

    CATEGORIAS (uma figura pode ter VÁRIAS):
      - quantidade, ordem, medida, decomposicao, sequencia, comparacao,
        objetos_escolares, formas, numeros, nenhuma
    """
    __tablename__ = "figure_bank"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO
    # ============================================================
    nome = Column(String(200), nullable=False)
    # Ex: 'carrinho de brinquedo', 'maçã vermelha', 'pódio'

    categoria = Column(String(50), nullable=False, index=True)
    # LEGADO — mantido por segurança. Corresponde à primeira categoria da lista.

    categorias = Column(JSONB, nullable=True)
    # Lista de categorias pedagógicas.
    # Ex: ["quantidade", "formas"]
    # Uma figura pode pertencer a várias categorias ao mesmo tempo.

    subcategoria = Column(String(100), nullable=True, index=True)
    # Ex: 'brinquedos' | 'frutas' | 'animais' | 'escola' | ...

    keywords = Column(JSONB, nullable=True)
    # Lista de palavras-chave para busca.
    # Ex: ["carrinho", "brinquedo", "veículo", "roda", "infantil"]

    # ============================================================
    # ARQUIVO (bytes no banco)
    # ============================================================
    file_data = Column(LargeBinary, nullable=False)
    # Bytes do arquivo (SVG, PNG, JPG, WEBP)

    mime_type = Column(String(50), nullable=False)
    # Ex: 'image/svg+xml' | 'image/png' | 'image/jpeg' | 'image/webp'

    file_size = Column(Integer, nullable=True)
    # Tamanho em bytes (útil para monitorar uso e limitar upload)

    # ============================================================
    # AUTORIA E ESTADO
    # ============================================================
    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    aprovada = Column(Boolean, default=True, nullable=False, index=True)

    origem = Column(String(20), nullable=False, default="manual")
    # 'manual' | 'ia_vision' | 'importado_biblioteca'

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)
    updated_at = Column(DateTime, server_default="now()", nullable=False)

    def __repr__(self):
        cats = self.categorias or [self.categoria]
        return f"<FigureBank {self.nome} ({cats})>"