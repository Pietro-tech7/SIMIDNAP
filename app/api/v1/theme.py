from fastapi import APIRouter, Depends, HTTPException, Header, Body
from sqlalchemy.orm import Session
from typing import Dict, Any

from ...core.database import get_db
from ...models.user import User
from ...services.theme_service import (
    get_theme_config,
    update_theme_config,
    reset_theme_config,
)
from ...schemas.theme_config import ThemeConfigOut
from ...core.security import decode_token

router = APIRouter(prefix="/theme", tags=["theme"])


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
# ROTA PÚBLICA — Frontend lê o tema
# ============================================================
@router.get("/config", response_model=ThemeConfigOut)
def public_config(db: Session = Depends(get_db)):
    return get_theme_config(db)


# ============================================================
# ROTAS ADMIN — Config
# ============================================================
@router.get("/admin/config", response_model=ThemeConfigOut)
def admin_get_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    return get_theme_config(db)


@router.put("/admin/config", response_model=ThemeConfigOut)
def admin_update_config(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    try:
        config_row = update_theme_config(
            db, new_config=data, updated_by=str(current_user.id)
        )
        return config_row
    except Exception as e:
        print(f"[Theme Update] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar configuração. Verifique os dados e tente novamente."
        )


@router.post("/admin/config/reset", response_model=ThemeConfigOut)
def admin_reset_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    try:
        config_row = reset_theme_config(db, updated_by=str(current_user.id))
        return config_row
    except Exception as e:
        print(f"[Theme Reset] Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao resetar configuração.")