from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from ...core.database import get_db
from ...models.user import User
from ...services.subscription_service import (
    info_assinatura,
    trocar_plano,
    listar_planos,
)
from ...core.security import decode_token

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
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
    return user


class TrocarPlanoRequest(BaseModel):
    plano: str


@router.get("/planos")
def planos():
    """Lista os planos disponíveis."""
    return listar_planos()


@router.get("/status")
def status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna o status da assinatura do usuário logado."""
    return info_assinatura(db, str(current_user.id))


@router.post("/trocar")
def trocar(
    data: TrocarPlanoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Troca o plano do usuário (mock — sem pagamento real por enquanto)."""
    try:
        sub = trocar_plano(db, str(current_user.id), data.plano)
        return info_assinatura(db, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))