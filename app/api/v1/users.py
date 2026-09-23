from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
import base64
from ...core.database import get_db
from ...models.user import User
from ...schemas.user import UserOut, ChangePassword, UpdateProfile
from ...core.security import decode_token, hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])

# Limite de tamanho do avatar (em bytes) — 2 MB
LIMITE_AVATAR = 2 * 1024 * 1024


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


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(
    data: UpdateProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.estado is not None:
        current_user.estado = (data.estado or "").upper() or None
    if data.rede is not None:
        current_user.rede = data.rede or None

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Recebe a imagem já redimensionada em base64 e salva no perfil."""
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=400,
            detail="Formato inválido. Use JPG, PNG ou WEBP.",
        )

    conteudo = await file.read()

    if len(conteudo) > LIMITE_AVATAR:
        raise HTTPException(
            status_code=400,
            detail="Imagem muito grande. Máximo 2 MB.",
        )

    b64 = base64.b64encode(conteudo).decode("utf-8")
    data_url = f"data:{file.content_type};base64,{b64}"

    current_user.avatar_url = data_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me/avatar", response_model=UserOut)
def remove_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ter pelo menos 6 caracteres.",
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="A nova senha deve ser diferente da atual.",
        )

    current_user.hashed_password = hash_password(data.new_password)
    db.commit()

    return {"message": "Senha alterada com sucesso."}