from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional, List, Any
from pydantic import BaseModel

from ...core.database import get_db
from ...models.user import User
from ...core.security import decode_token
from ...services.system_settings_service import (
    listar_settings,
    listar_flags_publicas,
    set_setting,
    obter_setting,
)

router = APIRouter(prefix="/system", tags=["system"])


# ============================================================
# AUTENTICAÇÃO — SUPER ADMIN
# Mesmo padrão usado em landing.py (sem alterar nada lá).
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
# ROTA PÚBLICA — Flags do sistema
# Usada pelo hook useSystemFlags() no frontend (landing e painel).
# Sem autenticação — expõe apenas dados não sensíveis.
# ============================================================
@router.get("/flags")
def public_flags(db: Session = Depends(get_db)):
    return listar_flags_publicas(db)


# ============================================================
# ROTAS ADMIN — Listar / Editar settings
# ============================================================
@router.get("/admin/settings")
def admin_list_settings(
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Lista todas as settings cadastradas + as declaradas em DEFAULTS.
    Filtro opcional por categoria.
    """
    return {
        "categoria_filtro": categoria,
        "settings": listar_settings(db, categoria=categoria),
    }


class SettingUpdate(BaseModel):
    chave: str
    valor: Any
    tipo: Optional[str] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = None


@router.patch("/admin/settings")
def admin_update_setting(
    payload: SettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Cria ou atualiza uma setting (upsert).
    """
    try:
        row = set_setting(
            db,
            chave=payload.chave,
            valor=payload.valor,
            tipo=payload.tipo,
            categoria=payload.categoria,
            descricao=payload.descricao,
            updated_by=str(current_user.id),
        )
        return {
            "ok": True,
            "chave": row.chave,
            "valor": obter_setting(db, row.chave),
            "tipo": row.tipo,
            "categoria": row.categoria,
            "descricao": row.descricao,
        }
    except Exception as e:
        print(f"[SystemSettings Update] Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar configuração.")


class BatchUpdate(BaseModel):
    items: List[SettingUpdate]


@router.patch("/admin/settings/batch")
def admin_update_batch(
    payload: BatchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Atualiza várias settings de uma vez.
    """
    try:
        atualizadas = []
        for item in payload.items:
            row = set_setting(
                db,
                chave=item.chave,
                valor=item.valor,
                tipo=item.tipo,
                categoria=item.categoria,
                descricao=item.descricao,
                updated_by=str(current_user.id),
            )
            atualizadas.append(row.chave)
        return {"ok": True, "atualizadas": atualizadas}
    except Exception as e:
        print(f"[SystemSettings Batch] Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações.")