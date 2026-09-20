from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Boolean, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from ..core.database import Base


class SuccessfulPractice(Base):
    __tablename__ = "successful_practices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # ============================================================
    # IDENTIFICAÇÃO
    # ============================================================
    title = Column(String, nullable=False)
    # 'professor' | 'coordenador'
    perfil = Column(String, nullable=False)
    # 'ja_tenho' | 'criar'
    flow_type = Column(String, nullable=False)
    # 'melhorar' | 'documento' (só quando flow_type='ja_tenho')
    sub_flow = Column(String, nullable=True)
    # 'educacao_infantil' | 'ciclo_alfabetizacao' | 'gestao_escolar'
    category = Column(String, nullable=False)

    # ============================================================
    # CONTEXTO ESCOLAR
    # ============================================================
    school = Column(String, nullable=True)      # nome da escola
    city = Column(String, nullable=True)        # município
    gre = Column(String, nullable=True)         # Gerência Regional de Educação
    grade = Column(String, nullable=True)       # série/ano/etapa atual
    subject = Column(String, nullable=True)     # área do conhecimento

    # ============================================================
    # DADOS ESPECÍFICOS DA PRÁTICA
    # ============================================================
    original_grade = Column(String, nullable=True)   # ano original (ao mudar de turma)
    target_grade = Column(String, nullable=True)     # novo ano (ao mudar de turma)
    has_special_needs = Column(Boolean, default=False, nullable=False)
    duration = Column(String, nullable=True)         # duração desejada (ex: 'ano todo')
    num_alunos = Column(Integer, nullable=True)

    # ============================================================
    # INPUT DO USUÁRIO E OUTPUT DA IA
    # ============================================================
    description = Column(Text, nullable=False)       # relato principal
    structured_data = Column(JSONB, nullable=False)  # Q&A completas + resultado da IA

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())