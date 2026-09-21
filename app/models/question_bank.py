from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class QuestionBank(Base):
    """
    Banco de questões oficiais (ENEM, futuramente SAEB e estaduais).

    Cada questão é armazenada individualmente com metadados da prova
    de origem. Permite busca por etapa, área, disciplina, ano e texto.
    """
    __tablename__ = "question_bank"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ============================================================
    # IDENTIFICAÇÃO DA PROVA
    # ============================================================
    fonte = Column(String, nullable=False, index=True)  # 'ENEM' | 'SAEB' | 'PROVA_PARANA' | ...
    ano = Column(Integer, nullable=False, index=True)   # 2023, 2022, etc
    etapa = Column(String, nullable=False, index=True)  # 'EM' (ENEM) | 'EF' (SAEB)
    area = Column(String, nullable=True, index=True)    # 'Linguagens' | 'Matemática' | 'CN' | 'CH'
    disciplina = Column(String, nullable=True, index=True)  # 'Língua Portuguesa', 'História', etc

    # ============================================================
    # IDENTIFICAÇÃO DA QUESTÃO
    # ============================================================
    numero = Column(Integer, nullable=False)            # Número da questão na prova original
    tipo = Column(String, nullable=True)                # 'multipla_escolha' | 'discursiva'
    cor_caderno = Column(String, nullable=True)         # 'azul', 'amarela', 'branca', 'rosa' (ENEM)

    # ============================================================
    # CONTEÚDO
    # ============================================================
    enunciado = Column(Text, nullable=False)
    alternativas = Column(JSONB, nullable=True)         # Lista: [{'letra': 'A', 'texto': '...', 'imagem_url': None}, ...]
    gabarito = Column(String, nullable=True)            # 'A', 'B', 'C', 'D', 'E' ou texto para discursivas
    imagem_url = Column(String, nullable=True)          # URL ou data URL da imagem principal
    imagens_extras = Column(JSONB, nullable=True)       # Lista de URLs adicionais

    # ============================================================
    # METADADOS ÚTEIS
    # ============================================================
    habilidades = Column(JSONB, nullable=True)          # Lista de habilidades BNCC/descritores relacionados
    dificuldade = Column(String, nullable=True)         # 'facil' | 'media' | 'dificil' (quando disponível)
    anulada = Column(Boolean, default=False, nullable=False)
    raw_data = Column(JSONB, nullable=True)             # JSON completo original (auditoria)

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
    )