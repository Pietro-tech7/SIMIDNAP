from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class QuestionBank(Base):
    """
    Banco de questões unificado.

    Fontes suportadas:
    - Importadas: ENEM (oficial), futuras importações
    - Geradas por IA: questões criadas pelos professores e enviadas para curadoria
    - Colaborador: questões enviadas por professores e aprovadas

    Cada questão é armazenada individualmente com metadados completos.
    """
    __tablename__ = "question_bank"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO DA PROVA
    # ============================================================
    fonte = Column(String, nullable=False, index=True)      # 'ENEM' | 'SAEB' | 'SAEPI' | 'SIMIDNAPE' | ...
    ano = Column(Integer, nullable=False, index=True)       # 2023, 2022, etc
    etapa = Column(String, nullable=False, index=True)      # 'EI' | 'EF' | 'EM'
    area = Column(String, nullable=True, index=True)        # 'Linguagens' | 'Matemática' | 'CN' | 'CH'
    disciplina = Column(String, nullable=True, index=True)  # 'Língua Portuguesa', 'História', etc.
    serie = Column(String, nullable=True, index=True)       # '1º ano', '5º ano', '9º ano' (para EF/EI)

    # ============================================================
    # IDENTIFICAÇÃO DA QUESTÃO
    # ============================================================
    numero = Column(Integer, nullable=True)                 # Número da questão na prova original
    tipo = Column(String, nullable=True)                    # 'multipla_escolha' | 'discursiva'
    cor_caderno = Column(String, nullable=True)             # 'azul', 'amarela', 'branca', 'rosa' (ENEM)

    # ============================================================
    # CONTEÚDO
    # ============================================================
    enunciado = Column(Text, nullable=False)
    alternativas = Column(JSONB, nullable=True)             # [{'letra': 'A', 'texto': '...', 'imagem_url': None}, ...]
    gabarito = Column(String, nullable=True)                # 'A', 'B', 'C', 'D', 'E' ou texto
    imagem_url = Column(String, nullable=True)              # URL ou data URL da imagem principal
    imagens_extras = Column(JSONB, nullable=True)           # Lista de URLs adicionais

    # ============================================================
    # METADADOS PEDAGÓGICOS
    # ============================================================
    habilidades = Column(JSONB, nullable=True)              # Lista completa (BNCC, PI, PPAIC, descritores)
    habilidade_codigo = Column(String, nullable=True, index=True)  # Código único, ex: 'EF05MA01'
    referencial = Column(String, nullable=True, index=True) # 'bncc' | 'curriculo_piaui' | 'ppaic' | 'saeb' | 'saepi' | 'enem'
    dificuldade = Column(String, nullable=True)             # 'facil' | 'media' | 'dificil'
    anulada = Column(Boolean, default=False, nullable=False)
    raw_data = Column(JSONB, nullable=True)                 # JSON completo original (auditoria)

    # ============================================================
    # ORIGEM E CURADORIA
    # ============================================================
    origem = Column(String, default="importada", nullable=False, index=True)  # 'importada' | 'gerada_ia' | 'colaborador'
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    approved = Column(Boolean, default=True, nullable=False, index=True)      # True = público no banco
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)

    # ============================================================
    # ÍNDICES PARA BUSCA RÁPIDA
    # ============================================================
    __table_args__ = (
        Index("ix_question_bank_fonte_ano_etapa", "fonte", "ano", "etapa"),
        Index("ix_question_bank_area_disciplina", "area", "disciplina"),
        Index("ix_question_bank_approved_origem", "approved", "origem"),
        Index("ix_question_bank_referencial_serie", "referencial", "serie"),
    )