from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.user import User
from ...models.announcement import Announcement
from ...schemas.announcement import AnnouncementCreate, AnnouncementOut
from ...core.security import decode_token

router = APIRouter(prefix="/announcements", tags=["announcements"])


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


def get_current_superuser(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")
    return current_user


def _to_out(db: Session, anuncio: Announcement) -> AnnouncementOut:
    """Converte o modelo para o schema de saída, incluindo o nome do destinatário."""
    target_name = None
    if anuncio.target_user_id:
        target = db.query(User).filter(User.id == anuncio.target_user_id).first()
        if target:
            target_name = target.full_name

    return AnnouncementOut(
        id=anuncio.id,
        author_id=anuncio.author_id,
        target_user_id=anuncio.target_user_id,
        title=anuncio.title,
        message=anuncio.message,
        tipo=anuncio.tipo,
        read=anuncio.read,
        active=anuncio.active,
        created_at=anuncio.created_at,
        target_user_name=target_name,
    )


# ============================================================
# CRIAÇÃO (somente admin)
# ============================================================
@router.post("", response_model=AnnouncementOut, status_code=201)
def criar_recado(
    data: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    if data.tipo not in ("info", "aviso", "sucesso"):
        raise HTTPException(status_code=400, detail="Tipo inválido. Use: info, aviso ou sucesso.")

    if not data.title.strip():
        raise HTTPException(status_code=400, detail="Título obrigatório.")

    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Mensagem obrigatória.")

    # Se target_user_id foi informado, valida que existe
    if data.target_user_id:
        alvo = db.query(User).filter(User.id == data.target_user_id).first()
        if not alvo:
            raise HTTPException(status_code=404, detail="Usuário destinatário não encontrado.")

    novo = Announcement(
        author_id=current_user.id,
        target_user_id=data.target_user_id,
        title=data.title.strip(),
        message=data.message.strip(),
        tipo=data.tipo,
        active=True,
        read=False,
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return _to_out(db, novo)


# ============================================================
# LISTAGEM PARA O ADMIN (todos)
# ============================================================
@router.get("/all", response_model=List[AnnouncementOut])
def listar_todos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    anuncios = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return [_to_out(db, a) for a in anuncios]


# ============================================================
# LISTAGEM PARA O USUÁRIO LOGADO (próprios + gerais ativos)
# ============================================================
@router.get("/me", response_model=List[AnnouncementOut])
def listar_meus(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    anuncios = (
        db.query(Announcement)
        .filter(Announcement.active == True)
        .filter(
            (Announcement.target_user_id == None) |  # noqa: E711 (gerais)
            (Announcement.target_user_id == current_user.id)  # individuais para ele
        )
        .order_by(Announcement.created_at.desc())
        .all()
    )
    return [_to_out(db, a) for a in anuncios]


# ============================================================
# MARCAR COMO LIDO
# ============================================================
@router.put("/{announcement_id}/read")
def marcar_lido(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    anuncio = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not anuncio:
        raise HTTPException(status_code=404, detail="Recado não encontrado.")

    # Só pode marcar se for destinatário direto ou se for geral
    if anuncio.target_user_id and anuncio.target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este recado.")

    anuncio.read = True
    db.commit()
    return {"message": "Recado marcado como lido."}


# ============================================================
# DESATIVAR (admin) — o recado deixa de aparecer
# ============================================================
@router.put("/{announcement_id}/deactivate")
def desativar(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    anuncio = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not anuncio:
        raise HTTPException(status_code=404, detail="Recado não encontrado.")
    anuncio.active = False
    db.commit()
    return {"message": "Recado desativado."}


# ============================================================
# EXCLUIR (admin)
# ============================================================
@router.delete("/{announcement_id}", status_code=204)
def excluir(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    anuncio = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not anuncio:
        raise HTTPException(status_code=404, detail="Recado não encontrado.")
    db.delete(anuncio)
    db.commit()
    return None