from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class QuestionBankFundamental(Base):
    """
    Banco de questões do Motor 8 (Curado) e Motor 9 (IA).
    Exclusivo para Educação Infantil e Ensino Fundamental.

    Totalmente independente do Motor 7 (ENEM), que usa a tabela `question_bank`.
    """
    __tablename__ = "question_bank_fundamental"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO DA PROVA
    # ============================================================
    fonte = Column(String, nullable=True, index=True)         # "SAEB" | "SAEPI" | "PIAUI" | "SIMIDNAPE" | "IA"
    ano = Column(Integer, nullable=True, index=True)          # 1 a 9 (ou NULL para EI)
    etapa = Column(String(2), nullable=False, index=True)     # "EI" | "EF"
    serie = Column(String(50), nullable=True, index=True)     # "1º ano", "5º ano"
    componente = Column(String(10), nullable=True, index=True)  # "MA", "LP", "HI", etc.
    disciplina = Column(String(100), nullable=True, index=True)  # "Matemática"

    # ============================================================
    # IDENTIFICAÇÃO DA QUESTÃO
    # ============================================================
    numero = Column(Integer, nullable=True)
    tipo = Column(String, nullable=True)  # "multipla_escolha" | "dissertativa" | "ligar_colunas" | ...

    # ============================================================
    # CONTEÚDO
    # ============================================================
    enunciado = Column(Text, nullable=False)
    alternativas = Column(JSONB, nullable=True)  # [{"letra": "A", "texto": "...", "imagem_url": "..."}]
    gabarito = Column(String, nullable=True)
    imagem_url = Column(String, nullable=True)   # figura principal (data URL ou URL)
    imagens_extras = Column(JSONB, nullable=True)

    # ============================================================
    # METADADOS PEDAGÓGICOS
    # ============================================================
    habilidades = Column(JSONB, nullable=True)                 # lista de códigos BNCC / PI
    habilidade_codigo = Column(String(50), nullable=True, index=True)
    referencial = Column(String(30), nullable=True, index=True)  # "bncc" | "curriculo_piaui" | "saeb" | "saepi" | "ppaic"
    referencias_extras = Column(JSONB, nullable=True)          # múltiplos referenciais
    descritores = Column(JSONB, nullable=True)                 # descritores SAEB/SAEPI
    dificuldade = Column(String, nullable=True)                # "facil" | "media" | "dificil"

    # ============================================================
    # ORIGEM E CURADORIA
    # ============================================================
    origem = Column(String(20), nullable=False, default="manual", index=True)  # "manual" | "importada" | "gerada_ia" | "colaborador"
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    approved = Column(Boolean, nullable=False, default=True, index=True)  # admin pode criar já aprovado
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    anulada = Column(Boolean, default=False, nullable=False)
    trashed_at = Column(DateTime, nullable=True)  # quando foi jogada na lixeira

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)

    # ============================================================
    # ÍNDICES
    # ============================================================
    __table_args__ = (
        Index("ix_qbf_etapa_ano", "etapa", "ano"),
        Index("ix_qbf_componente", "componente"),
        Index("ix_qbf_referencial", "referencial"),
        Index("ix_qbf_approved_origem", "approved", "origem"),
    )