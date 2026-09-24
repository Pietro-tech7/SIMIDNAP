import bncc
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session


# ============================================================
# COMPLEMENTOS DO CURRÍCULO DO PIAUÍ
# ============================================================
def _buscar_complementos_pi(
    db: Optional[Session],
    codigos_bncc: List[str],
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Busca complementos do Currículo do Piauí para uma lista de códigos BNCC.

    Retorna dict: { codigo_bncc: [complemento1, complemento2, ...] }

    Os complementos são ordenados por `ordem` (ex: .1PI vem antes de .2PI).
    """
    if not db or not codigos_bncc:
        return {}

    try:
        from ..models.curriculo_piaui_skill import CurriculoPiauiSkill
    except ImportError:
        return {}

    try:
        registros = (
            db.query(CurriculoPiauiSkill)
            .filter(CurriculoPiauiSkill.codigo_bncc.in_(codigos_bncc))
            .all()
        )
    except Exception:
        return {}

    resultado: Dict[str, List[Dict[str, Any]]] = {}
    for r in registros:
        resultado.setdefault(r.codigo_bncc, []).append({
            "codigo": r.codigo,
            "texto": r.texto,
            "ordem": r.ordem,
            "etapa": r.etapa,
            "ano": r.ano,
            "componente": r.componente,
            "unidade_tematica": r.unidade_tematica or "",
            "objeto_conhecimento": r.objeto_conhecimento or "",
        })

    # Ordena cada lista por `ordem` (None vai por último)
    for codigo in resultado:
        resultado[codigo].sort(key=lambda x: (x["ordem"] is None, x["ordem"] or 0))

    return resultado


# ============================================================
# LISTAGEM DE HABILIDADES
# ============================================================
def listar_habilidades(
    etapa: str = "EF",
    componente: Optional[str] = None,
    ano: Optional[int] = None,
    busca: Optional[str] = None,
    estado: Optional[str] = None,
    db: Optional[Session] = None,
) -> List[Dict[str, Any]]:
    """
    Lista habilidades da BNCC.

    Parâmetros:
      etapa: 'EF' (Fundamental), 'EI' (Infantil), 'EM' (Médio)
      componente: ex: 'MA' (Matemática), 'LP' (Língua Portuguesa)
      ano: ex: 5 (5º ano) — apenas para Fundamental
      busca: texto livre
      estado: se 'PI', anexa complementos do Currículo do Piauí
      db: sessão do banco (necessária se `estado` for informado)
    """
    resultados: List[Dict[str, Any]] = []

    try:
        if busca:
            resultados_raw = bncc.buscar(busca, etapa=etapa, ano=ano, componente=componente)
            for item in resultados_raw:
                resultados.append(_formatar_habilidade(item))
        elif etapa == "EF":
            resultados_raw = bncc.habilidades_ef(componente=componente, ano=ano)
            for item in resultados_raw:
                resultados.append(_formatar_habilidade(item))
        elif etapa == "EM":
            resultados_raw = bncc.habilidades_em(area=componente)
            for item in resultados_raw:
                resultados.append(_formatar_habilidade(item))
        elif etapa == "EI":
            resultados_raw = bncc.objetivos_ei(campo=componente)
            for item in resultados_raw:
                resultados.append(_formatar_habilidade(item))
    except Exception:
        pass

    # ============================================================
    # ENRIQUECIMENTO COM CURRÍCULO DO PIAUÍ
    # ============================================================
    if estado and estado.upper() == "PI" and db and resultados:
        codigos = [r["codigo"] for r in resultados if r.get("codigo")]
        complementos_map = _buscar_complementos_pi(db, codigos)
        for r in resultados:
            r["complementos_pi"] = complementos_map.get(r.get("codigo"), [])
    else:
        for r in resultados:
            r["complementos_pi"] = []

    return resultados


# ============================================================
# BUSCA POR CÓDIGO
# ============================================================
def obter_habilidade(
    codigo: str,
    estado: Optional[str] = None,
    db: Optional[Session] = None,
) -> Optional[Dict[str, Any]]:
    """
    Retorna uma habilidade específica pelo código (ex: EF05MA03).
    Se estado='PI', anexa complementos do Currículo do Piauí.
    """
    try:
        item = bncc.por_codigo(codigo)
        resultado = _formatar_habilidade(item)
    except Exception:
        return None

    if estado and estado.upper() == "PI" and db:
        complementos_map = _buscar_complementos_pi(db, [codigo])
        resultado["complementos_pi"] = complementos_map.get(codigo, [])
    else:
        resultado["complementos_pi"] = []

    return resultado


# ============================================================
# FORMATAÇÃO
# ============================================================
def _formatar_habilidade(item: Dict[str, Any]) -> Dict[str, Any]:
    """Padroniza a saída da biblioteca bncc."""
    return {
        "codigo": item.get("codigo"),
        "texto": item.get("texto"),
        "etapa": item.get("etapa"),
        "componente": item.get("componente") or item.get("area") or item.get("campo"),
        "ano": item.get("ano"),
        "objeto_conhecimento": item.get("objeto_conhecimento"),
        "unidade_tematica": item.get("unidade_tematica"),
        "fonte": item.get("fonte"),
    }


# ============================================================
# COMPONENTES
# ============================================================
def listar_componentes(etapa: str = "EF") -> List[Dict[str, str]]:
    """Lista os componentes curriculares disponíveis para a etapa."""
    if etapa == "EF":
        return [
            {"codigo": "LP", "nome": "Língua Portuguesa"},
            {"codigo": "MA", "nome": "Matemática"},
            {"codigo": "CI", "nome": "Ciências"},
            {"codigo": "GE", "nome": "Geografia"},
            {"codigo": "HI", "nome": "História"},
            {"codigo": "AR", "nome": "Arte"},
            {"codigo": "EF", "nome": "Educação Física"},
            {"codigo": "ER", "nome": "Ensino Religioso"},
            {"codigo": "LI", "nome": "Língua Inglesa"},
            {"codigo": "CO", "nome": "Computação"},
        ]
    elif etapa == "EM":
        return [
            {"codigo": "LGG", "nome": "Linguagens e suas Tecnologias"},
            {"codigo": "MAT", "nome": "Matemática e suas Tecnologias"},
            {"codigo": "CNT", "nome": "Ciências da Natureza e suas Tecnologias"},
            {"codigo": "CHS", "nome": "Ciências Humanas e Sociais Aplicadas"},
        ]
    elif etapa == "EI":
        return [
            {"codigo": "EO", "nome": "O eu, o outro e o nós"},
            {"codigo": "CG", "nome": "Corpo, gestos e movimentos"},
            {"codigo": "TS", "nome": "Traços, sons, cores e formas"},
            {"codigo": "EF", "nome": "Escuta, fala, pensamento e imaginação"},
            {"codigo": "ET", "nome": "Espaços, tempos, quantidades, relações e transformações"},
        ]
    return []