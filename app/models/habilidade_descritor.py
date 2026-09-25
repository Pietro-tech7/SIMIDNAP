from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class HabilidadeDescritor(Base):
    """
    Correlação entre habilidades BNCC e descritores SAEB/SAEPI.

    Uma habilidade pode ter vários descritores relacionados;
    um descritor pode estar ligado a várias habilidades.

    Fonte da correlação:
    - 'heuristica': gerada automaticamente por similaridade textual
    - 'manual': aprovada/editada por um humano
    - 'ia': gerada por IA
    """
    __tablename__ = "habilidade_descritor"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # RELACIONAMENTO
    # ============================================================
    habilidade_codigo = Column(String(20), nullable=False, index=True)
    # Ex: 'EF05MA01' — código BNCC

    descritor_id = Column(
        UUID(as_uuid=True),
        ForeignKey("descritores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ============================================================
    # QUALIDADE DA CORRELAÇÃO
    # ============================================================
    confianca = Column(String(10), nullable=False, default="media", index=True)
    # 'alta' | 'media' | 'baixa'

    fonte_correlacao = Column(String(20), nullable=False, default="heuristica")
    # 'heuristica' | 'manual' | 'ia'

    revisado = Column(Boolean, default=False, nullable=False, index=True)
    # True = foi revisado por humano

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)

    __table_args__ = (
        UniqueConstraint("habilidade_codigo", "descritor_id", name="uq_hab_desc"),
        Index("ix_hab_desc_codigo", "habilidade_codigo"),
        Index("ix_hab_desc_confianca", "confianca", "revisado"),
    )

    def __repr__(self):
        return f"<HabilidadeDescritor {self.habilidade_codigo} → {self.descritor_id}>"