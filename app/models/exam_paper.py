from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class ExamPaper(Base):
    """
    Prova montada pelo professor (motor 8 — Banco Curado ou motor 9 — Banco IA).

    Guarda os parâmetros da prova, o cabeçalho personalizado e a lista de questões
    escolhidas/geradas. Permite reabrir, reeditar e rebaixar o PDF.

    Modos:
      - 'curado'   → questões selecionadas do banco comum
      - 'ia_gerada' → questões geradas pela IA (podem ou não estar no banco comum)
    """
    __tablename__ = "exam_papers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # ============================================================
    # IDENTIFICAÇÃO
    # ============================================================
    titulo = Column(String(200), nullable=False)
    # Ex: "Avaliação de Matemática - 5º ano - Maio/2026"

    modo = Column(String(20), nullable=False, index=True)
    # 'curado' | 'ia_gerada'

    # ============================================================
    # PARÂMETROS DA PROVA
    # ============================================================
    etapa = Column(String(2), nullable=True)          # 'EI' | 'EF' | 'EM'
    ano = Column(Integer, nullable=True)              # 1..9 (EF) ou NULL (EI/EM)
    serie = Column(String(50), nullable=True)         # Ex: "5º ano A"
    componente = Column(String(10), nullable=True)    # 'MA', 'LP', etc.
    disciplina_nome = Column(String(100), nullable=True)  # Ex: "Matemática"

    # ============================================================
    # CABEÇALHO PERSONALIZADO (JSONB — flexível)
    # ============================================================
    cabecalho = Column(JSONB, nullable=True)
    # Estrutura esperada:
    # {
    #   "escola": "...",
    #   "gre": "...",
    #   "rede": "...",
    #   "turno": "...",
    #   "professor": "...",
    #   "turma": "...",
    #   "data": "...",
    #   "logo_prefeitura": "data:image/...",
    #   "logo_escola": "data:image/..."
    # }

    # ============================================================
    # QUESTÕES
    # ============================================================
    questoes = Column(JSONB, nullable=False, default=list)
    # Lista de objetos:
    # [
    #   { "ordem": 1, "question_bank_id": "uuid", "snapshot": { enunciado, alternativas, ... }, "icone_svg": "..." },
    #   ...
    # ]
    # Guardamos o SNAPSHOT para que, se a questão for alterada no banco comum,
    # a prova antiga do professor continue exatamente igual.

    num_questoes = Column(Integer, nullable=False, default=0)
    gabarito_incluido = Column(Boolean, default=False, nullable=False)

    # ============================================================
    # CURADORIA (apenas para modo 'ia_gerada')
    # ============================================================
    enviado_para_curadoria = Column(Boolean, default=False, nullable=False)
    aprovado_pelo_admin = Column(Boolean, default=False, nullable=False)

    # ============================================================
    # RETENÇÃO AUTOMÁTICA (Bloco D — política de 3 camadas)
    # ============================================================
    retencao_nivel = Column(Integer, nullable=False, default=1, index=True)
    # 1 = rascunho (nunca usada em prova)       → descarta após 30 dias
    # 2 = usada em prova (PDF/Word)             → descarta após 90 dias
    # 3 = favorita / reutilizada / curadoria    → nunca descarta

    ultima_utilizacao_em = Column(DateTime, nullable=True, index=True)
    # Atualizada sempre que a prova é baixada em PDF/Word.

    # ============================================================
    # CONTROLE
    # ============================================================
    created_at = Column(DateTime, server_default="now()", nullable=False)
    updated_at = Column(DateTime, onupdate="now()", nullable=True)

    # ============================================================
    # ÍNDICES
    # ============================================================
    __table_args__ = (
        Index("ix_exam_papers_user_modo", "user_id", "modo"),
        Index("ix_exam_papers_user_created", "user_id", "created_at"),
    )

    def __repr__(self):
        return f"<ExamPaper {self.titulo} ({self.modo})>"