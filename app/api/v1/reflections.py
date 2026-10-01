from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.user import User
from ...schemas.reflection import (
    ReflectionStart,
    ReflectionMessage,
    ReflectionOut,
    ReflectionMessageOut,
)
from ...services.therapy_service import (
    start_reflection,
    add_message,
    list_reflections,
    get_reflection,
    delete_reflection,
    list_themes,
)
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/reflections", tags=["reflections"])


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


@router.get("/themes")
def themes():
    """Lista os temas disponíveis para a Terapia Pedagógica."""
    return list_themes()


@router.post("/start", response_model=ReflectionOut, status_code=201)
def start(
    data: ReflectionStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Iniciar a conversa é grátis — o custo é por mensagem enviada
    reflection = start_reflection(
        db=db,
        user_id=str(current_user.id),
        theme=data.theme,
        title=data.title,
    )
    return reflection


@router.post("/{reflection_id}/message", response_model=ReflectionMessageOut)
def message(
    reflection_id: str,
    data: ReflectionMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verifica créditos ANTES de enviar a mensagem (0.2 crédito por mensagem)
    pode, custo = verificar_creditos(db, str(current_user.id), "chat_message")
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    result = add_message(
        db=db,
        user_id=str(current_user.id),
        reflection_id=reflection_id,
        content=data.content,
        user=current_user,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")

    # Só consome créditos se a mensagem foi processada com sucesso
    consumir_creditos(db, str(current_user.id), "chat_message", custo)
    return result


@router.get("", response_model=List[ReflectionOut])
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_reflections(db, str(current_user.id))


@router.get("/{reflection_id}", response_model=ReflectionOut)
def get_one(
    reflection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reflection = get_reflection(db, str(current_user.id), reflection_id)
    if not reflection:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return reflection


@router.delete("/{reflection_id}", status_code=204)
def remove(
    reflection_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reflection = delete_reflection(db, str(current_user.id), reflection_id)
    if not reflection:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return None