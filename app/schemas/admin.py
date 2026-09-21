from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# USUÁRIO
# ============================================================
class AdminUserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    # Dados da assinatura (juntos via join)
    plan: Optional[str] = None
    plan_status: Optional[str] = None
    credits_total: Optional[float] = None
    credits_used: Optional[float] = None
    credits_available: Optional[float] = None

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


# ============================================================
# CRÉDITOS
# ============================================================
class AdminAddCredits(BaseModel):
    quantidade: float  # em créditos (ex: 5.0, 10.0) — pode ser negativo


class AdminResetCredits(BaseModel):
    confirmar: bool = True


class AdminTrocarPlano(BaseModel):
    plano: str  # "trial", "basico", "padrao", "avancado"
    creditos_total: Optional[float] = None  # se informado, sobrescreve


# ============================================================
# MÉTRICAS
# ============================================================
class AdminMetricsOut(BaseModel):
    total_usuarios: int
    usuarios_ativos: int
    usuarios_bloqueados: int
    usuarios_trial: int
    usuarios_basico: int
    usuarios_padrao: int
    usuarios_avancado: int
    creditos_consumidos_total: float
    ultimos_7_dias_cadastros: int


# ============================================================
# USO
# ============================================================
class AdminUsageLogOut(BaseModel):
    id: UUID
    user_id: UUID
    task_type: str
    credits_consumed: float
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# CONTEÚDO GERADO PELO USUÁRIO (visor do super admin)
# ============================================================
class AdminContentItem(BaseModel):
    """Resumo de um conteúdo gerado por um usuário."""
    id: UUID
    content_type: str       # 'pratica_exitosa' | 'material' | 'lesson_plan' | 'reflection' | 'pedagogical_case'
    title: str
    subtitle: Optional[str] = None  # resumo curto (ex: 'criar | professor' ou 'simulado | 9º ano')
    created_at: datetime

    class Config:
        from_attributes = True


class AdminContentList(BaseModel):
    """Lista de todos os conteúdos de um usuário."""
    items: List[AdminContentItem]
    total: int
    counts: Dict[str, int] = {}  # ex: {'pratica_exitosa': 5, 'material': 12, ...}


class AdminContentDetail(BaseModel):
    """Conteúdo completo de um item específico."""
    id: UUID
    content_type: str
    title: str
    created_at: datetime
    data: Dict[str, Any]  # payload completo (structured_data, messages, analysis, etc.)