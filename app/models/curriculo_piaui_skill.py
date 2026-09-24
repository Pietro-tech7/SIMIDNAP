from sqlalchemy import Column, String, Integer, Text, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base


class CurriculoPiauiSkill(Base):
    """
    Habilidades complementares do Currículo do Piauí.

    O Currículo do Piauí usa os MESMOS códigos da BNCC, com sufixo `.NPI`
    para indicar complementações regionais.

    Exemplo:
      - BNCC:  EF05MA01      (texto nacional)
      - Piauí: EF05MA01.1PI  (complemento regional)

    Esta tabela NÃO substitui a BNCC. É uma biblioteca complementar,
    consultada apenas quando o professor é do Piauí.

    Referencial para SAEB/SAEPI será tratado em tabela separada (fase futura).
    """
    __tablename__ = "curriculo_piaui_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO
    # ============================================================
    codigo = Column(String(30), unique=True, nullable=False, index=True)
    # Ex: "EF05MA01.1PI"

    codigo_bncc = Column(String(20), nullable=False, index=True)
    # Ex: "EF05MA01" (código BNCC base — permite agrupar complementos)

    ordem = Column(Integer, nullable=True)
    # Ex: 1 (de ".1PI"), 2 (de ".2PI"), etc. Útil para ordenar.

    # ============================================================
    # TEXTO DA HABILIDADE
    # ============================================================
    texto = Column(Text, nullable=False)
    # Texto completo da habilidade complementar

    # ============================================================
    # METADADOS PEDAGÓGICOS
    # ============================================================
    etapa = Column(String(2), nullable=True, index=True)
    # "EI" | "EF" | "EM"

    ano = Column(Integer, nullable=True, index=True)
    # 1, 2, 3, ..., 9 (ou NULL para EM)

    componente = Column(String(10), nullable=True, index=True)
    # "MA", "LP", "HI", "GE", "CI", "AR", "EF", "ER", "LI"

    unidade_tematica = Column(String(200), nullable=True)
    # Ex: "Números", "Álgebra", "Geometria"

    objeto_conhecimento = Column(Text, nullable=True)
    # Ex: "Sistema de numeração decimal..."

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)

    # ============================================================
    # ÍNDICES
    # ============================================================
    __table_args__ = (
        Index("ix_curriculo_pi_codigo_bncc", "codigo_bncc"),
        Index("ix_curriculo_pi_etapa_ano", "etapa", "ano"),
        Index("ix_curriculo_pi_componente", "componente"),
    )

    def __repr__(self):
        return f"<CurriculoPiauiSkill {self.codigo}>"