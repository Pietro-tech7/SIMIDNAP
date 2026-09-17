from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...models.user import User
from ...schemas.lesson_plan import LessonPlanGenerate, LessonPlanOut
from ...services.lesson_plan_service import (
    generate_lesson_plan,
    list_lesson_plans,
    get_lesson_plan,
    delete_lesson_plan,
)
from ...services.bncc_service import obter_habilidade
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/lesson-plans", tags=["lesson-plans"])


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


@router.post("/generate", response_model=LessonPlanOut, status_code=201)
def generate(
    data: LessonPlanGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.plan_type not in ("neuroaula", "aula_que_funciona"):
        raise HTTPException(status_code=400, detail="Tipo de plano inválido.")

    # Verifica créditos ANTES de gerar (considerando diferenciado)
    diferenciado = data.diferenciado or False
    pode, custo = verificar_creditos(
        db,
        str(current_user.id),
        data.plan_type,
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

    plan = generate_lesson_plan(
        db=db,
        user_id=str(current_user.id),
        plan_type=data.plan_type,
        title=data.title,
        subject=data.subject,
        grade=data.grade,
        content=data.content,
        objective=data.objective,
        bncc_codigo=data.bncc_codigo,
        bncc_texto=bncc_texto,
        duracao_minutos=data.duracao_minutos,
        tipo_aula=data.tipo_aula,
        num_alunos=data.num_alunos,
        dificuldades=data.dificuldades,
        conhecimentos_previos=data.conhecimentos_previos,
        necessidades_especificas=data.necessidades_especificas,
        diferenciado=diferenciado,
        extra=data.extra,
    )

    # Só consome créditos se gerou com sucesso
    consumir_creditos(db, str(current_user.id), data.plan_type, custo)
    return plan


@router.get("", response_model=List[LessonPlanOut])
def list_all(
    plan_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_lesson_plans(db, str(current_user.id), plan_type)


@router.get("/{plan_id}", response_model=LessonPlanOut)
def get_one(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = get_lesson_plan(db, str(current_user.id), plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return plan


@router.delete("/{plan_id}", status_code=204)
def remove(
    plan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = delete_lesson_plan(db, str(current_user.id), plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado.")
    return None