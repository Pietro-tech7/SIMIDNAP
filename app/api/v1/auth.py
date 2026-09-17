from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.user import User
from ...schemas.auth import UserRegister, UserLogin, TokenResponse
from ...core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=201)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    hashed = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed,
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Usuário criado com sucesso."}

@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuário inativo.")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(response: Response, refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token não fornecido.")
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token inválido.")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido.")
    new_access = create_access_token(data={"sub": user_id})
    return {"access_token": new_access, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Logout realizado com sucesso."}