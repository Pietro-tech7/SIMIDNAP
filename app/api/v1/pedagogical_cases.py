import json
from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db, SessionLocal
from ...models.user import User
from ...models.pedagogical_case import PedagogicalCase
from ...schemas.pedagogical_case import (
    PedagogicalCaseCreate,
    PedagogicalCaseUpdate,
    PedagogicalCaseOut,
    PedagogicalCaseAnalyzeResponse,
)
from ...services.pedagogical_case_service import (
    create_case,
    list_cases,
    get_case,
    update_case,
    delete_case,
    analyze_case,
    _montar_payload,
)
from ...services.ai_service import get_ai_service
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...core.security import decode_token

router = APIRouter(prefix="/pedagogical-cases", tags=["pedagogical-cases"])


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


@router.post("", response_model=PedagogicalCaseOut, status_code=201)
def create(
    data: PedagogicalCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = create_case(
        db=db,
        user_id=str(current_user.id),
        title=data.title,
        description=data.description,
        grade=data.grade,
        subject=data.subject,
        frequencia=data.frequencia,
        situacoes=data.situacoes,
        reacao_aluno=data.reacao_aluno,
        ja_tentou=data.ja_tentou,
        contexto_adicional=data.contexto_adicional,
    )
    return case


@router.get("", response_model=List[PedagogicalCaseOut])
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_cases(db, str(current_user.id))


@router.get("/{case_id}", response_model=PedagogicalCaseOut)
def get_one(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = get_case(db, str(current_user.id), case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Situação não encontrada.")
    return case


@router.put("/{case_id}", response_model=PedagogicalCaseOut)
def update(
    case_id: str,
    data: PedagogicalCaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = update_case(
        db,
        str(current_user.id),
        case_id,
        data.model_dump(exclude_unset=True),
    )
    if not case:
        raise HTTPException(status_code=404, detail="Situação não encontrada.")
    return case


@router.delete("/{case_id}", status_code=204)
def remove(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = delete_case(db, str(current_user.id), case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Situação não encontrada.")
    return None


@router.post("/{case_id}/analyze", response_model=PedagogicalCaseAnalyzeResponse)
def analyze(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pode, custo = verificar_creditos(db, str(current_user.id), "meu_aluno_analyze")
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    resultado = analyze_case(db, str(current_user.id), case_id)
    if "erro" in resultado:
        raise HTTPException(status_code=400, detail=resultado["erro"])

    consumir_creditos(db, str(current_user.id), "meu_aluno_analyze", custo)
    return resultado


@router.post("/{case_id}/analyze/stream")
async def analyze_stream(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Análise em streaming (SSE — o texto aparece progressivamente).
    Usa uma sessão de banco NOVA dentro do gerador, porque a sessão
    injetada pelo FastAPI é fechada quando a função retorna.
    """
    # 1. Verifica créditos ANTES de iniciar (usa a sessão injetada)
    pode, custo = verificar_creditos(db, str(current_user.id), "meu_aluno_analyze")
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar."
        )

    case = get_case(db, str(current_user.id), case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Situação não encontrada.")

    # 2. Captura os dados ANTES do streaming (sessão será fechada)
    user_id = str(current_user.id)
    payload = _montar_payload(case)

    ai = get_ai_service()

    async def gerar():
        yield "event: inicio\ndata: {\"status\": \"ok\"}\n\n"

        texto_acumulado = ""
        try:
            async for chunk in ai.generate_structured_stream("situacao_pedagogica", payload):
                texto_acumulado += chunk
                payload_chunk = json.dumps({"texto": chunk}, ensure_ascii=False)
                yield f"event: chunk\ndata: {payload_chunk}\n\n"

            # Limpa o texto e tenta parsear como JSON
            texto_limpo = texto_acumulado.strip()
            if texto_limpo.startswith("```"):
                texto_limpo = texto_limpo.split("```")[1]
                if texto_limpo.startswith("json"):
                    texto_limpo = texto_limpo[4:]
            texto_limpo = texto_limpo.strip()

            try:
                resultado = json.loads(texto_limpo)
            except json.JSONDecodeError as e:
                print(f"[analyze_stream] JSON inválido: {e}")
                resultado = {"erro": "Falha ao processar resposta da IA."}

            # 3. USA UMA SESSÃO NOVA para salvar (a injetada está fechada)
            if "erro" not in resultado:
                try:
                    nova_db = SessionLocal()
                    try:
                        case_db = nova_db.query(PedagogicalCase).filter(
                            PedagogicalCase.id == case_id
                        ).first()
                        if case_db:
                            case_db.analysis = resultado
                            nova_db.commit()
                            print(f"[analyze_stream] Análise salva com sucesso para case {case_id}")

                            # Consome créditos na sessão nova também
                            consumir_creditos(nova_db, user_id, "meu_aluno_analyze", custo)
                        else:
                            print(f"[analyze_stream] Case {case_id} não encontrado na nova sessão")
                    finally:
                        nova_db.close()
                except Exception as e:
                    print(f"[analyze_stream] Erro ao salvar no banco: {e}")

            payload_final = json.dumps({"resultado": resultado}, ensure_ascii=False)
            yield f"event: completo\ndata: {payload_final}\n\n"

        except Exception as e:
            print(f"[analyze_stream] Erro geral: {e}")
            payload_erro = json.dumps({"detail": str(e)}, ensure_ascii=False)
            yield f"event: erro\ndata: {payload_erro}\n\n"

    return StreamingResponse(
        gerar(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )