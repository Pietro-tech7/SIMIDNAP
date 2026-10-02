"""
Serviço de armazenamento de imagens da landing page.

Fluxo:
1. Admin envia arquivo (multipart/form-data)
2. Validamos tipo e tamanho (5 MB máximo)
3. Salvamos em `landing_assets` (chave: slot único)
4. Retornamos URL pública: /api/v1/landing/image/{id}
5. O admin cola essa URL no campo correspondente da config

Slots válidos:
- hero_image
- bg_image
- problem_image
- solution_image
- founder_photo
- testimonials_image
- faq_image
"""

from typing import Optional, List, Dict
from uuid import UUID
from sqlalchemy.orm import Session

from ..models.landing_asset import LandingAsset


# ============================================================
# CONFIGURAÇÃO
# ============================================================
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
TIPOS_PERMITIDOS = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

SLOTS_VALIDOS = {
    "hero_image",
    "bg_image",
    "problem_image",
    "solution_image",
    "founder_photo",
    "testimonials_image",
    "faq_image",
    "login_photo",
    "register_photo",
}


# ============================================================
# UPLOAD
# ============================================================
def salvar_asset(
    db: Session,
    slot: str,
    filename: str,
    mime_type: str,
    data: bytes,
    uploaded_by: Optional[str] = None,
) -> LandingAsset:
    """
    Salva (ou substitui) a imagem de um slot.
    Levanta ValueError se o slot, tipo ou tamanho forem inválidos.
    """
    # Valida slot
    if slot not in SLOTS_VALIDOS:
        raise ValueError(
            f"Slot inválido: '{slot}'. Opções: {sorted(SLOTS_VALIDOS)}"
        )

    # Valida tipo
    if mime_type not in TIPOS_PERMITIDOS:
        raise ValueError(
            f"Tipo de arquivo não permitido: '{mime_type}'. "
            f"Use: JPG, PNG, WEBP ou GIF."
        )

    # Valida tamanho
    if len(data) > MAX_SIZE_BYTES:
        tamanho_mb = len(data) / (1024 * 1024)
        raise ValueError(
            f"Imagem muito grande ({tamanho_mb:.1f} MB). Limite: 5 MB."
        )

    if len(data) == 0:
        raise ValueError("Arquivo vazio.")

    # Procura asset existente no slot
    existente = db.query(LandingAsset).filter(LandingAsset.slot == slot).first()

    if existente:
        # Substitui
        existente.filename = filename
        existente.mime_type = mime_type
        existente.size_bytes = len(data)
        existente.data = data
        if uploaded_by:
            existente.uploaded_by = uploaded_by
        db.commit()
        db.refresh(existente)
        return existente

    # Cria novo
    asset = LandingAsset(
        slot=slot,
        filename=filename,
        mime_type=mime_type,
        size_bytes=len(data),
        data=data,
        uploaded_by=uploaded_by,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


# ============================================================
# BUSCAR POR ID
# ============================================================
def get_asset_por_id(db: Session, asset_id: UUID) -> Optional[LandingAsset]:
    return db.query(LandingAsset).filter(LandingAsset.id == asset_id).first()


# ============================================================
# BUSCAR POR SLOT
# ============================================================
def get_asset_por_slot(db: Session, slot: str) -> Optional[LandingAsset]:
    return db.query(LandingAsset).filter(LandingAsset.slot == slot).first()


# ============================================================
# REMOVER
# ============================================================
def remover_asset(db: Session, slot: str) -> bool:
    """Remove a imagem de um slot. Retorna True se removeu, False se não existia."""
    asset = get_asset_por_slot(db, slot)
    if not asset:
        return False
    db.delete(asset)
    db.commit()
    return True


# ============================================================
# LISTAR TODOS
# ============================================================
def listar_assets(db: Session) -> List[Dict]:
    """
    Lista todos os assets cadastrados.
    Retorna apenas metadados (sem os bytes da imagem).
    """
    assets = db.query(LandingAsset).all()
    return [
        {
            "slot": a.slot,
            "asset_id": str(a.id),
            "url": f"/api/v1/landing/image/{a.id}",
            "filename": a.filename,
            "mime_type": a.mime_type,
            "size_bytes": a.size_bytes,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        }
        for a in assets
    ]


# ============================================================
# LIMPAR TODOS OS ASSETS DE UM DETERMINADO SLOT (batch)
# ============================================================
def limpar_assets_orfaos(db: Session, slots_ativos: List[str]) -> int:
    """
    Remove assets de slots que não estão mais em uso.
    Útil quando o admin muda a estrutura da landing.
    """
    removidos = 0
    for asset in db.query(LandingAsset).all():
        if asset.slot not in slots_ativos:
            db.delete(asset)
            removidos += 1
    if removidos:
        db.commit()
    return removidos