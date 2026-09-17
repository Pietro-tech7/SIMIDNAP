import bncc
from typing import List, Dict, Any, Optional


def listar_habilidades(
    etapa: str = "EF",
    componente: Optional[str] = None,
    ano: Optional[int] = None,
    busca: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Lista habilidades da BNCC.
    etapa: 'EF' (Fundamental), 'EI' (Infantil), 'EM' (Médio)
    componente: ex: 'MA' (Matemática), 'LP' (Língua Portuguesa)
    ano: ex: 5 (5º ano) - apenas para Fundamental
    busca: texto livre
    """
    resultados = []

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

    return resultados


def obter_habilidade(codigo: str) -> Optional[Dict[str, Any]]:
    """Retorna uma habilidade específica pelo código (ex: EF05MA03)."""
    try:
        item = bncc.por_codigo(codigo)
        return _formatar_habilidade(item)
    except Exception:
        return None


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