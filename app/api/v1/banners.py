from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...models.user import User
from ...models.banner import Banner
from ...schemas.banner import BannerCreate, BannerUpdate, BannerOut
from ...core.security import decode_token
from fastapi import UploadFile, File
import base64

router = APIRouter(prefix="/banners", tags=["banners"])

TIPOS_MIDIA_VALIDOS = (
    "nenhuma",
    "imagem",
    "video",
    "embed_instagram",
    "embed_tiktok",
    "embed_facebook",
)


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido.")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


def get_current_superuser(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return current_user


# ============================================================
# CRIAR BANNER
# ============================================================
@router.post("", response_model=BannerOut, status_code=201)
def criar_banner(
    data: BannerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    if data.tipo_midia not in TIPOS_MIDIA_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de mídia inválido. Opções: {', '.join(TIPOS_MIDIA_VALIDOS)}"
        )

    # Desativa os anteriores (só 1 ativo por vez)
    db.query(Banner).update({Banner.ativo: False})

    novo = Banner(
        author_id=current_user.id,
        titulo=data.titulo,
        texto=data.texto,
        imagem_perfil=data.imagem_perfil,
        tipo_midia=data.tipo_midia or "nenhuma",
        imagem_url=data.imagem_url,
        link_url=data.link_url,
        telefone=data.telefone,
        ativo=True,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


# ============================================================
# EDITAR BANNER (só o ativo, ou qualquer um pelo id)
# ============================================================
@router.put("/{banner_id}", response_model=BannerOut)
def editar_banner(
    banner_id: str,
    data: BannerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner não encontrado.")

    if data.tipo_midia is not None and data.tipo_midia not in TIPOS_MIDIA_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de mídia inválido. Opções: {', '.join(TIPOS_MIDIA_VALIDOS)}"
        )

    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None and hasattr(banner, key):
            setattr(banner, key, value)

    db.commit()
    db.refresh(banner)
    return banner


# ============================================================
# BUSCAR BANNER ATIVO (endpoint público — sem autenticação)
# ============================================================
@router.get("/ativo", response_model=Optional[BannerOut])
def banner_ativo(db: Session = Depends(get_db)):
    banner = db.query(Banner).filter(Banner.ativo == True).order_by(Banner.created_at.desc()).first()
    return banner


# ============================================================
# LISTAR TODOS OS BANNERS (admin)
# ============================================================
@router.get("/all", response_model=List[BannerOut])
def listar_banners(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    return db.query(Banner).order_by(Banner.created_at.desc()).all()


# ============================================================
# DESATIVAR BANNER
# ============================================================
@router.put("/{banner_id}/desativar")
def desativar_banner(
    banner_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner não encontrado.")
    banner.ativo = False
    db.commit()
    return {"message": "Banner desativado."}


# ============================================================
# EXCLUIR BANNER
# ============================================================
@router.delete("/{banner_id}", status_code=204)
def excluir_banner(
    banner_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner não encontrado.")
    db.delete(banner)
    db.commit()
    return None


# ============================================================
# UPLOAD DE MÍDIA DO BANNER
# ============================================================
LIMITE_MIDIA = 5 * 1024 * 1024  # 5 MB


@router.post("/upload")
async def upload_midia_banner(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_superuser),
):
    """
    Recebe um arquivo (imagem ou vídeo curto) e retorna a data URL.
    Suporta JPG, PNG, WEBP, MP4.
    """
    tipos_validos = ("image/jpeg", "image/png", "image/webp", "video/mp4")

    if file.content_type not in tipos_validos:
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Use JPG, PNG, WEBP ou MP4."
        )

    conteudo = await file.read()

    if len(conteudo) > LIMITE_MIDIA:
        raise HTTPException(
            status_code=400,
            detail="Arquivo muito grande. Máximo 5 MB."
        )

    b64 = base64.b64encode(conteudo).decode("utf-8")
    data_url = f"data:{file.content_type};base64,{b64}"

    return {"url": data_url}