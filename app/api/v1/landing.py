from fastapi import APIRouter, Depends, HTTPException, Header, Body, UploadFile, File, Path
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from uuid import UUID

from ...core.database import get_db
from ...models.user import User
from ...services.landing_service import (
    get_landing_config,
    update_landing_config,
    reset_landing_config,
)
from ...services.landing_asset_service import (
    salvar_asset,
    get_asset_por_id,
    get_asset_por_slot,
    remover_asset,
    listar_assets,
    SLOTS_VALIDOS,
)
from ...schemas.landing_config import LandingConfigOut
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
# ROTA PÚBLICA — Landing lê a config
# ============================================================
@router.get("/config", response_model=LandingConfigOut)
def public_config(db: Session = Depends(get_db)):
    return get_landing_config(db)


# ============================================================
# ROTA PÚBLICA — Servir uma imagem enviada
# ============================================================
@router.get("/image/{asset_id}")
def serve_image(
    asset_id: str,
    db: Session = Depends(get_db),
):
    """
    Serve uma imagem enviada pelo admin.
    Pública (a landing precisa acessar sem login).
    """
    try:
        uid = UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")

    asset = get_asset_por_id(db, uid)
    if not asset:
        raise HTTPException(status_code=404, detail="Imagem não encontrada.")

    return Response(
        content=asset.data,
        media_type=asset.mime_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": f'inline; filename="{asset.filename or asset.slot}"',
        },
    )


# ============================================================
# ROTAS ADMIN — Config
# ============================================================
@router.get("/admin/config", response_model=LandingConfigOut)
def admin_get_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    return get_landing_config(db)


@router.put("/admin/config", response_model=LandingConfigOut)
def admin_update_config(
    data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    try:
        config_row = update_landing_config(
            db, new_config=data, updated_by=str(current_user.id)
        )
        return config_row
    except Exception as e:
        print(f"[Landing Update] Erro: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao salvar configuração. Verifique os dados e tente novamente."
        )


@router.post("/admin/config/reset", response_model=LandingConfigOut)
def admin_reset_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    try:
        config_row = reset_landing_config(db, updated_by=str(current_user.id))
        return config_row
    except Exception as e:
        print(f"[Landing Reset] Erro: {e}")
        raise HTTPException(status_code=500, detail="Erro ao resetar configuração.")


# ============================================================
# ROTAS ADMIN — Upload de imagens
# ============================================================
@router.post("/admin/upload/{slot}")
async def upload_image(
    slot: str = Path(..., description="Nome do slot (ex: hero_image)"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Recebe uma imagem e salva no slot especificado.
    Retorna a URL pública para ser usada na config.
    """
    if slot not in SLOTS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Slot inválido. Use um de: {sorted(SLOTS_VALIDOS)}"
        )

    try:
        conteudo = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao ler arquivo: {e}")

    try:
        asset = salvar_asset(
            db=db,
            slot=slot,
            filename=file.filename or slot,
            mime_type=file.content_type or "application/octet-stream",
            data=conteudo,
            uploaded_by=str(current_user.id),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ok": True,
        "slot": asset.slot,
        "asset_id": str(asset.id),
        "url": f"/api/v1/landing/image/{asset.id}",
        "size_bytes": asset.size_bytes,
        "mime_type": asset.mime_type,
    }


@router.delete("/admin/upload/{slot}")
def delete_image(
    slot: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Remove a imagem de um slot."""
    removeu = remover_asset(db, slot)
    if not removeu:
        raise HTTPException(status_code=404, detail="Nenhuma imagem neste slot.")
    return {"ok": True, "slot": slot}


@router.get("/admin/assets")
def list_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """
    Lista todas as imagens cadastradas.
    Retorna metadados (sem os bytes), úteis para o admin mostrar as miniaturas.
    """
    return {
        "slots_disponiveis": sorted(SLOTS_VALIDOS),
        "assets": listar_assets(db),
    }