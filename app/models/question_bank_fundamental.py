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
    fonte = Column(String, nullable=True, index=True)         # "SAEB" | "SAEPI" | "PIAUI" | "SIMIDNAPE" | "IA" | "SIMIDNAPE_ADMIN"
    ano = Column(Integer, nullable=True, index=True)          # 1 a 9 (ou NULL para EI)
    etapa = Column(String(2), nullable=False, index=True)     # "EI" | "EF"
    serie = Column(String(50), nullable=True, index=True)     # "1º ano", "5º ano"
    componente = Column(String(10), nullable=True, index=True)  # "MA", "LP", "HI", etc.
    disciplina = Column(String(100), nullable=True, index=True)  # "Matemática"

    # ============================================================
    # ESTRUTURA CURRICULAR (NOVO — Bloco C)
    # ============================================================
    unidade_tematica = Column(String(200), nullable=True, index=True)
    # Ex: 'Números', 'Geometria', 'Identidades e alteridades'

    objeto_conhecimento = Column(String(300), nullable=True, index=True)
    # Ex: 'Sistema de numeração decimal', 'O eu, o outro e o nós'

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
    approved = Column(Boolean, nullable=False, default=True, index=True)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    anulada = Column(Boolean, default=False, nullable=False)
    trashed_at = Column(DateTime, nullable=True)  # quando foi jogada na lixeira

    # ============================================================
    # RETENÇÃO AUTOMÁTICA (Bloco D — política de 3 camadas)
    # ============================================================
    retencao_nivel = Column(Integer, nullable=False, default=1, index=True)
    # 1 = rascunho (nunca usada em prova)       → descarta após 30 dias
    # 2 = usada em prova (PDF/Word)             → descarta após 90 dias
    # 3 = favorita / reutilizada / curadoria    → nunca descarta
    # O cron job semanal recalcula e aplica a política.

    ultima_utilizacao_em = Column(DateTime, nullable=True, index=True)
    # Atualizada sempre que a questão é usada em uma prova gerada.
    # Base para o cálculo de retenção.

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
        Index("ix_qbf_unidade", "componente", "ano", "unidade_tematica"),
        Index("ix_qbf_objeto", "componente", "ano", "unidade_tematica", "objeto_conhecimento"),
    )