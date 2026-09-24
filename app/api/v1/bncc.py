from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...services.bncc_service import listar_habilidades, obter_habilidade, listar_componentes

router = APIRouter(prefix="/bncc", tags=["bncc"])


@router.get("/componentes")
def componentes(etapa: str = Query("EF")):
    """Lista os componentes curriculares disponíveis."""
    return listar_componentes(etapa)


@router.get("/habilidades")
def habilidades(
    etapa: str = Query("EF"),
    componente: Optional[str] = Query(None),
    ano: Optional[int] = Query(None),
    busca: Optional[str] = Query(None),
    estado: Optional[str] = Query(None, description="UF (ex: 'PI'). Se 'PI', anexa complementos do Currículo do Piauí."),
    db: Session = Depends(get_db),
):
    """
    Lista habilidades da BNCC por etapa, componente, ano ou busca textual.

    Se `estado=PI`, cada habilidade vem com `complementos_pi: [...]`.
    """
    return listar_habilidades(
        etapa=etapa,
        componente=componente,
        ano=ano,
        busca=busca,
        estado=estado,
        db=db,
    )


@router.get("/habilidades/{codigo}")
def habilidade_por_codigo(
    codigo: str,
    estado: Optional[str] = Query(None, description="UF (ex: 'PI'). Se 'PI', anexa complementos do Currículo do Piauí."),
    db: Session = Depends(get_db),
):
    """Retorna uma habilidade específica pelo código (ex: EF05MA03)."""
    item = obter_habilidade(codigo, estado=estado, db=db)
    if not item:
        return {"erro": "Habilidade não encontrada."}
    return item