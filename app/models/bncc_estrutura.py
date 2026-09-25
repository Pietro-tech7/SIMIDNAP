from sqlalchemy import Column, String, Integer, Text, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class BnccEstrutura(Base):
    """
    Estrutura curricular completa da BNCC.

    Hierarquia: Componente → Unidade Temática → Objeto de Conhecimento → Habilidade
    Os descritores (SAEB/SAEPI) são relacionados à habilidade quando aplicáveis.

    Esta tabela é uma biblioteca de referência — não é modificada por professores.
    """
    __tablename__ = "bncc_estrutura"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO
    # ============================================================
    etapa = Column(String(2), nullable=False, index=True)      # 'EI' | 'EF' | 'EM'
    ano = Column(Integer, nullable=True, index=True)           # 1 a 9 (NULL para EI/EM)
    componente = Column(String(10), nullable=False, index=True)  # 'MA' | 'LP' | 'HI' | 'GE' | 'CI' | 'AR' | 'EF' | 'ER' | 'LI' | 'CO'

    # ============================================================
    # ESTRUTURA CURRICULAR
    # ============================================================
    unidade_tematica = Column(String(200), nullable=True, index=True)
    # Ex: 'Números', 'Álgebra', 'Geometria', 'Identidades e alteridades'

    objeto_conhecimento = Column(String(300), nullable=True, index=True)
    # Ex: 'Sistema de numeração decimal', 'O eu, o outro e o nós'

    # ============================================================
    # HABILIDADE
    # ============================================================
    habilidade_codigo = Column(String(20), nullable=False, index=True)
    # Ex: 'EF02MA01', 'EF01ER01'

    habilidade_texto = Column(Text, nullable=False)
    # Texto completo da habilidade

    # ============================================================
    # DESCRITORES RELACIONADOS (quando aplicável)
    # ============================================================
    descritores_relacionados = Column(JSONB, nullable=True)
    # Lista de códigos: ['D01', 'D05'] — apenas para LP, MT e (9º ano) CI/HI/GE

    tem_descritor = Column(String(1), nullable=False, default="N", index=True)
    # 'S' ou 'N' — flag rápida para saber se há descritores

    # ============================================================
    # REFERENCIAL
    # ============================================================
    referencial = Column(String(30), nullable=False, default="bncc", index=True)
    # 'bncc' | 'curriculo_piaui'

    complemento_pi = Column(Text, nullable=True)
    # Texto do complemento do Currículo do Piauí (se houver)

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)

    # ============================================================
    # ÍNDICES E CONSTRAINTS
    # ============================================================
    __table_args__ = (
        UniqueConstraint(
            "referencial", "habilidade_codigo", "unidade_tematica", "objeto_conhecimento",
            name="uq_bncc_estrutura",
        ),
        Index("ix_bncc_comp_ano", "componente", "ano"),
        Index("ix_bncc_unidade", "componente", "ano", "unidade_tematica"),
        Index("ix_bncc_objeto", "componente", "ano", "unidade_tematica", "objeto_conhecimento"),
    )

    def __repr__(self):
        return f"<BnccEstrutura {self.habilidade_codigo} — {self.componente} {self.ano}>"