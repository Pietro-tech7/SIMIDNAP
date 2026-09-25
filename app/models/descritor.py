from sqlalchemy import Column, String, Integer, Text, DateTime, Boolean, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class Descritor(Base):
    """
    Descritores das avaliações externas (SAEB e SAEPI).
    São ferramentas de avaliação — diferentes das habilidades da BNCC.

    Cada descritor está ligado a:
      - uma fonte ('saeb' | 'saepi')
      - um componente ('MA' | 'LP' | 'CI' | 'HI' | 'GE')
      - um ano (5 | 9 | None)
    """
    __tablename__ = "descritores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO
    # ============================================================
    fonte = Column(String(20), nullable=False, index=True)   # 'saeb' | 'saepi'
    componente = Column(String(10), nullable=False, index=True)  # 'MA' | 'LP' | 'CI' | 'HI' | 'GE'
    area = Column(String(100), nullable=True)                # 'Matemática' | 'Língua Portuguesa' | ...
    etapa = Column(String(2), nullable=True, index=True)     # 'EF' | 'EM'
    ano = Column(Integer, nullable=True, index=True)         # 5 | 9 | None

    # ============================================================
    # DESCRITOR
    # ============================================================
    codigo = Column(String(10), nullable=False, index=True)  # 'D01', 'D02', ...
    texto = Column(Text, nullable=False)                     # Descrição do descritor
    tema = Column(String(200), nullable=True)                # Ex: 'Espaço e forma', 'Números e operações'

    # ============================================================
    # CONTROLE
    # ============================================================
    ativo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default="now()", nullable=False)

    # ============================================================
    # ÍNDICES E CONSTRAINTS
    # ============================================================
    __table_args__ = (
        UniqueConstraint("fonte", "componente", "ano", "codigo", name="uq_descritor"),
        Index("ix_desc_fonte_comp_ano", "fonte", "componente", "ano"),
        Index("ix_desc_componente_ano", "componente", "ano"),
    )

    def __repr__(self):
        return f"<Descritor {self.fonte} {self.componente} {self.codigo}>"