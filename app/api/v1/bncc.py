from fastapi import APIRouter, Query
from typing import List, Optional
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
):
    """Lista habilidades da BNCC por etapa, componente, ano ou busca textual."""
    return listar_habilidades(etapa=etapa, componente=componente, ano=ano, busca=busca)


@router.get("/habilidades/{codigo}")
def habilidade_por_codigo(codigo: str):
    """Retorna uma habilidade específica pelo código (ex: EF05MA03)."""
    item = obter_habilidade(codigo)
    if not item:
        return {"erro": "Habilidade não encontrada."}
    return item