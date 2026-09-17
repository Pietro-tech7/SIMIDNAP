from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ...core.database import get_db
from ...models.user import User
from ...services.ai_service import get_ai_service
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/images", tags=["images"])


class GenerateImageRequest(BaseModel):
    prompt: str


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


@router.post("/generate")
async def generate_image(
    data: GenerateImageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pode, custo = verificar_creditos(db, str(current_user.id), "image_generation")
    if not pode:
        raise HTTPException(status_code=402, detail="Créditos insuficientes.")

    ai = get_ai_service()
    if not ai._gemini:
        raise HTTPException(status_code=503, detail="IA não configurada.")

    try:
        data_url = await ai._gemini.generate_image(data.prompt)
        consumir_creditos(db, str(current_user.id), "image_generation", custo)
        return {"imagem": data_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))