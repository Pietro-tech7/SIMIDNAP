from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
import base64
from ...core.database import get_db
from ...models.user import User
from ...schemas.user import (
    UserOut,
    ChangePassword,
    UpdateProfile,
    GeminiKeyIn,
    GeminiKeyOut,
)
from ...core.security import decode_token, hash_password, verify_password
from ...core.crypto import criptografar, descriptografar

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


# ============================================================
# MULTI-API KEY — Gemini (Bloco multi-API)
# ============================================================
def _mascarar_chave(chave: str) -> str:
    """Mostra só os primeiros 4 e últimos 4 caracteres de uma chave."""
    if not chave or len(chave) < 12:
        return "••••••••"
    return f"{chave[:4]}•••{chave[-4:]}"


@router.get("/me/gemini-key", response_model=GeminiKeyOut)
def obter_gemini_key(current_user: User = Depends(get_current_user)):
    """
    Retorna o status da chave do Gemini do usuário (SEMPRE mascarada).
    Nunca retorna a chave em texto puro.
    """
    if not current_user.gemini_api_key:
        return GeminiKeyOut(
            tem_chave=False,
            mensagem="Você ainda está usando a chave do sistema (5 créditos grátis).",
        )

    chave_plana = descriptografar(current_user.gemini_api_key)
    return GeminiKeyOut(
        tem_chave=True,
        chave_mascarada=_mascarar_chave(chave_plana) if chave_plana else "••••••••",
        data_cadastro=current_user.data_cadastro_api,
        mensagem="✅ Chave cadastrada. Você está usando sua própria API.",
    )


@router.post("/me/gemini-key", response_model=GeminiKeyOut)
def cadastrar_gemini_key(
    data: GeminiKeyIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cadastra a chave do Gemini do usuário.

    Regras:
      - Não existe endpoint de remoção (uma vez cadastrada, fica).
      - A chave é testada ANTES de ser salva.
      - A chave é criptografada com a SECRET_KEY antes de ir ao banco.
      - O cache do GeminiService do usuário é invalidado para recarregar com a nova chave.
    """
    chave_plana = (data.api_key or "").strip()

    if len(chave_plana) < 20:
        raise HTTPException(
            status_code=400,
            detail="Chave inválida. O formato esperado começa com 'AIzaSy' e tem cerca de 39 caracteres.",
        )

    # ------------------------------------------------------------
    # 1. Testa a chave fazendo uma chamada leve ao Gemini
    # ------------------------------------------------------------
    try:
        from google import genai
        client = genai.Client(api_key=chave_plana)
        # list() é uma chamada de metadados (não consome tokens)
        # Se a chave for inválida, lança exceção aqui
        list(client.models.list())
    except Exception as e:
        erro_msg = str(e)
        # Mensagens amigáveis
        if "API_KEY_INVALID" in erro_msg or "API key not valid" in erro_msg:
            detalhe = "A chave informada é inválida ou foi revogada pelo Google."
        elif "PERMISSION_DENIED" in erro_msg:
            detalhe = "A chave não tem permissão para usar a API do Gemini."
        else:
            detalhe = f"Não foi possível validar a chave: {erro_msg[:150]}"

        raise HTTPException(status_code=400, detail=detalhe)

    # ------------------------------------------------------------
    # 2. Criptografa e salva no banco
    # ------------------------------------------------------------
    try:
        current_user.gemini_api_key = criptografar(chave_plana)
        current_user.data_cadastro_api = datetime.utcnow()
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        print(f"[Gemini Key] Erro ao salvar chave do usuário {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar a chave. Tente novamente.")

    # ------------------------------------------------------------
    # 3. Invalida o cache da instância do usuário (recarrega com a nova chave)
    # ------------------------------------------------------------
    try:
        from ...services.gemini_service import invalidar_cache_usuario
        invalidar_cache_usuario(str(current_user.id))
    except Exception as e:
        print(f"[Gemini Key] Aviso: não foi possível invalidar cache do usuário: {e}")

    return GeminiKeyOut(
        tem_chave=True,
        chave_mascarada=_mascarar_chave(chave_plana),
        data_cadastro=current_user.data_cadastro_api,
        mensagem="✅ Chave cadastrada com sucesso! Seus créditos foram atualizados.",
    )