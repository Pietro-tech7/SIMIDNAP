from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.user import User
from ...schemas.material import MaterialGenerate, MaterialOut
from ...services.material_service import (
    generate_material,
    list_materials,
    get_material,
    delete_material,
)
from ...services.bncc_service import obter_habilidade
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/materials", tags=["materials"])


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


@router.post("/generate", response_model=MaterialOut, status_code=201)
def generate(
    data: MaterialGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tipos_validos = ("atividade_imprimivel", "jogo_dinamica", "simulado")
    if data.material_type not in tipos_validos:
        raise HTTPException(status_code=400, detail="Tipo de material inválido.")

    # Verifica créditos ANTES de gerar (considerando diferenciado)
    diferenciado = data.diferenciado or False
    pode, custo = verificar_creditos(
        db,
        str(current_user.id),
        data.material_type,
        diferenciado=diferenciado,
    )
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    bncc_texto = data.bncc_texto
    if data.bncc_codigo and not bncc_texto:
        habilidade = obter_habilidade(data.bncc_codigo)
        if habilidade and habilidade.get("texto"):
            bncc_texto = habilidade["texto"]

    material = generate_material(
        db=db,
        user_id=str(current_user.id),
        material_type=data.material_type,
        title=data.title,
        subject=data.subject,
        grade=data.grade,
        content=data.content,
        objective=data.objective,
        bncc_codigo=data.bncc_codigo,
        bncc_texto=bncc_texto,
        num_questoes=data.num_questoes,
        duracao_minutos=data.duracao_minutos,
        num_alunos=data.num_alunos,
        dificuldades=data.dificuldades,
        diferenciado=diferenciado,
        user=current_user,
    )

    # Só consome créditos se gerou com sucesso
    consumir_creditos(db, str(current_user.id), data.material_type, custo)
    return material


@router.get("", response_model=List[MaterialOut])
def list_all(
    material_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_materials(db, str(current_user.id), material_type)


@router.get("/{material_id}", response_model=MaterialOut)
def get_one(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = get_material(db, str(current_user.id), material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")
    return material


@router.delete("/{material_id}", status_code=204)
def remove(
    material_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    material = delete_material(db, str(current_user.id), material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")
    return None