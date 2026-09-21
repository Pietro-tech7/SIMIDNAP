"""
Serviço de importação de questões do ENEM via API pública enem.dev.

Fonte: https://api.enem.dev/v1
Licença: GNU GPL-2.0 (dados públicos, sem necessidade de atribuição)

Fluxo:
1. Buscar lista de provas disponíveis (GET /v1/exams)
2. Para cada prova, buscar metadados das questões (GET /v1/exams/{year})
3. Para cada questão, buscar conteúdo completo (GET /v1/exams/{year}/questions/{index})
4. Converter para o formato do banco SIMIDNAPE
5. Salvar no PostgreSQL (evitando duplicatas)

A importação é IDEMPOTENTE: rodar duas vezes não duplica questões.
"""

import time
import requests
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from ..models.question_bank import QuestionBank


# ============================================================
# CONFIGURAÇÃO
# ============================================================
API_BASE = "https://api.enem.dev/v1"
PAUSA_ENTRE_REQUISICOES = 0.4  # segundos (evita rate limit)
MAX_RETRIES = 3
TIMEOUT = 30


# ============================================================
# MAPEAMENTO DE DISCIPLINAS
# ============================================================
# A API usa 'value' em inglês/português; convertemos para nomes amigáveis
DISCIPLINAS_MAP = {
    "linguagens": "Linguagens, Códigos e suas Tecnologias",
    "matematica": "Matemática e suas Tecnologias",
    "ciencias-natureza": "Ciências da Natureza e suas Tecnologias",
    "ciencias-humanas": "Ciências Humanas e suas Tecnologias",
    # Sub-disciplinas específicas (quando a API detalhar)
    "portugues": "Língua Portuguesa",
    "literatura": "Literatura",
    "ingles": "Língua Inglesa",
    "espanhol": "Língua Espanhola",
    "historia": "História",
    "geografia": "Geografia",
    "filosofia": "Filosofia",
    "sociologia": "Sociologia",
    "biologia": "Biologia",
    "fisica": "Física",
    "quimica": "Química",
}


# ============================================================
# CLIENTE HTTP COM RETRY
# ============================================================
def _get_json(url: str) -> Optional[Dict[str, Any]]:
    """Faz GET com retry e tratamento de erro. Retorna None se falhar."""
    for tentativa in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.get(url, timeout=TIMEOUT)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:  # rate limit
                espera = 2 ** tentativa
                print(f"[Import] Rate limit. Aguardando {espera}s...")
                time.sleep(espera)
                continue
            else:
                print(f"[Import] HTTP {resp.status_code} em {url}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"[Import] Erro de rede ({tentativa}/{MAX_RETRIES}): {e}")
            if tentativa < MAX_RETRIES:
                time.sleep(2 ** tentativa)
    return None


# ============================================================
# LISTAR PROVAS DISPONÍVEIS
# ============================================================
def listar_provas_disponiveis() -> List[Dict[str, Any]]:
    """Retorna a lista de provas disponíveis na API."""
    data = _get_json(f"{API_BASE}/exams")
    if not data or not isinstance(data, list):
        return []
    return data


# ============================================================
# BUSCAR METADADOS DE UMA PROVA
# ============================================================
def buscar_prova(ano: int) -> Optional[Dict[str, Any]]:
    """Retorna os metadados de uma prova (incluindo a lista de questões)."""
    return _get_json(f"{API_BASE}/exams/{ano}")


# ============================================================
# BUSCAR QUESTÃO COMPLETA
# ============================================================
def buscar_questao(ano: int, index: int) -> Optional[Dict[str, Any]]:
    """Retorna o conteúdo completo de uma questão específica."""
    return _get_json(f"{API_BASE}/exams/{ano}/questions/{index}")


# ============================================================
# CONVERSÃO: API → FORMATO DO BANCO
# ============================================================
def _converter_alternativas(alternativas_raw: Any) -> List[Dict[str, Any]]:
    """
    Converte alternativas da API para o formato do SIMIDNAPE.
    Aceita tanto lista de strings quanto lista de objetos {letter, text}.
    """
    if not alternativas_raw or not isinstance(alternativas_raw, list):
        return []

    resultado = []
    letras = "ABCDE"

    for i, alt in enumerate(alternativas_raw):
        if isinstance(alt, dict):
            resultado.append({
                "letra": alt.get("letter") or alt.get("letra") or letras[i],
                "texto": alt.get("text") or alt.get("texto") or "",
                "imagem_url": alt.get("file") or alt.get("imagem_url"),
            })
        elif isinstance(alt, str):
            resultado.append({
                "letra": letras[i] if i < len(letras) else str(i + 1),
                "texto": alt,
                "imagem_url": None,
            })

    return resultado


def _converter_questao(
    ano: int,
    questao_raw: Dict[str, Any],
    metadata: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    """
    Converte uma questão da API para o formato do banco SIMIDNAPE.
    Retorna None se a questão for inválida (sem enunciado, etc).
    """
    if not questao_raw or not isinstance(questao_raw, dict):
        return None

    # Extrai campos com fallbacks (a API pode ter variações)
    enunciado = (
        questao_raw.get("context")
        or questao_raw.get("enunciado")
        or questao_raw.get("body")
        or ""
    ).strip()

    if not enunciado or len(enunciado) < 20:
        return None

    # Alternativas
    alternativas = _converter_alternativas(
        questao_raw.get("alternatives")
        or questao_raw.get("alternativas")
        or []
    )

    # Gabarito
    gabarito = (
        questao_raw.get("correctAlternative")
        or questao_raw.get("gabarito")
        or questao_raw.get("correct_answer")
        or None
    )

    # Disciplina
    disciplina_raw = questao_raw.get("discipline") or metadata.get("discipline") or ""
    disciplina = DISCIPLINAS_MAP.get(disciplina_raw, disciplina_raw)

    # Área
    area = DISCIPLINAS_MAP.get(disciplina_raw, disciplina_raw)

    # Imagens
    files = questao_raw.get("files") or []
    imagem_principal = None
    imagens_extras = []
    if isinstance(files, list):
        for i, f in enumerate(files):
            url = f.get("url") if isinstance(f, dict) else f
            if not url:
                continue
            if i == 0:
                imagem_principal = url
            else:
                imagens_extras.append(url)

    return {
        "fonte": "ENEM",
        "ano": ano,
        "etapa": "EM",
        "area": area,
        "disciplina": disciplina,
        "numero": questao_raw.get("index") or metadata.get("index") or 0,
        "tipo": "multipla_escolha",
        "cor_caderno": questao_raw.get("cor") or metadata.get("color"),
        "enunciado": enunciado,
        "alternativas": alternativas if alternativas else None,
        "gabarito": gabarito,
        "imagem_url": imagem_principal,
        "imagens_extras": imagens_extras if imagens_extras else None,
        "habilidades": None,
        "dificuldade": None,
        "anulada": bool(questao_raw.get("annulled", False)),
        "raw_data": questao_raw,
    }


# ============================================================
# IMPORTAÇÃO PRINCIPAL
# ============================================================
def importar_enem(
    db: Session,
    ano_inicio: int = 2009,
    ano_fim: int = 2023,
    verbose: bool = True,
) -> Dict[str, int]:
    """
    Importa todas as questões do ENEM no intervalo de anos.

    Retorna um dict com estatísticas:
    {'importadas': N, 'ignoradas': N, 'erros': N, 'total_provas': N}
    """
    stats = {"importadas": 0, "ignoradas": 0, "erros": 0, "total_provas": 0}

    if verbose:
        print(f"\n{'='*60}")
        print(f"[Import ENEM] Iniciando importação ({ano_inicio}–{ano_fim})")
        print(f"{'='*60}\n")

    for ano in range(ano_inicio, ano_fim + 1):
        if verbose:
            print(f"\n[Import] === ANO {ano} ===")

        prova = buscar_prova(ano)
        if not prova:
            if verbose:
                print(f"[Import] Prova {ano} não encontrada. Pulando.")
            stats["erros"] += 1
            continue

        stats["total_provas"] += 1
        questoes_meta = prova.get("questions") or []
        if verbose:
            print(f"[Import] {len(questoes_meta)} questões encontradas em {ano}")

        for q_meta in questoes_meta:
            index = q_meta.get("index")
            if not index:
                continue

            # Verifica se já existe (evita duplicata)
            existe = db.query(QuestionBank).filter(
                QuestionBank.fonte == "ENEM",
                QuestionBank.ano == ano,
                QuestionBank.numero == index,
            ).first()

            if existe:
                stats["ignoradas"] += 1
                continue

            # Busca questão completa
            q_completa = buscar_questao(ano, index)
            time.sleep(PAUSA_ENTRE_REQUISICOES)

            if not q_completa:
                stats["erros"] += 1
                continue

            # Converte para o formato do banco
            dados = _converter_questao(ano, q_completa, q_meta)
            if not dados:
                stats["ignoradas"] += 1
                continue

            # Salva no banco
            try:
                questao = QuestionBank(**dados)
                db.add(questao)
                db.commit()
                stats["importadas"] += 1
                if verbose:
                    print(f"  ✓ Q{index} importada ({dados['disciplina']})")
            except Exception as e:
                db.rollback()
                print(f"  ✗ Erro ao salvar Q{index}: {e}")
                stats["erros"] += 1

    if verbose:
        print(f"\n{'='*60}")
        print(f"[Import ENEM] CONCLUÍDO")
        print(f"  Provas processadas: {stats['total_provas']}")
        print(f"  Questões importadas: {stats['importadas']}")
        print(f"  Já existiam: {stats['ignoradas']}")
        print(f"  Erros: {stats['erros']}")
        print(f"{'='*60}\n")

    return stats