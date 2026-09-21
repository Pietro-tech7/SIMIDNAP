from fastapi import APIRouter, Depends, HTTPException, Header, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...core.database import get_db
from ...models.user import User
from ...services.landing_service import (
    get_landing_config,
    update_landing_config,
    reset_landing_config,
)
from ...schemas.landing_config import LandingConfigOut, LandingConfigSchema
from ...core.security import decode_token

router = APIRouter(prefix="/landing", tags=["landing"])


# ============================================================
# AUTENTICAÇÃO — SUPER ADMIN
# ============================================================
def get_current_superuser(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido.")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if not user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return user


# ============================================================
# ROTA PÚBLICA — Landing page lê a config
# ============================================================
@router.get("/config", response_model=LandingConfigOut)
def public_config(db: Session = Depends(get_db)):
    """
    Retorna a configuração atual da landing page.
    Esta rota é PÚBLICA — não requer autenticação.
    Se não existir config no banco, cria automaticamente com os defaults.
    """
    return get_landing_config(db)


# ============================================================
# ROTA ADMIN — Ver config
# ============================================================
@router.get("/admin/config", response_model=LandingConfigOut)
def admin_get_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Retorna a config completa para o painel admin (com metadados)."""
    return get_landing_config(db)


# ============================================================
# ROTA ADMIN — Atualizar config
# ============================================================
@router.put("/admin/config", response_model=LandingConfigOut)
def admin_update_config(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Atualiza a configuração da landing.
    Aceita o JSON completo OU apenas um pedaço (merge profundo).
    Ex: enviar apenas {"hero": {"headline": "Novo título"}} atualiza só essa chave.
    """
    try:
        config_row = update_landing_config(
            db,
            new_config=data,
            updated_by=str(current_user.id),
        )
        return config_row
    except Exception as e:
        print(f"[Landing Update] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar configuração. Verifique os dados e tente novamente."
        )


# ============================================================
# ROTA ADMIN — Resetar para padrão
# ============================================================
@router.post("/admin/config/reset", response_model=LandingConfigOut)
def admin_reset_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Reseta a configuração da landing para os valores padrão."""
    try:
        config_row = reset_landing_config(db, updated_by=str(current_user.id))
        return config_row
    except Exception as e:
        print(f"[Landing Reset] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao resetar configuração."
        )