"""
Rotas do Motor 9 — Banco de Questões IA.

Gera questões inéditas com Google Gemini. O frontend divide a geração
em lotes pequenos (máx 4 questões) para evitar timeout do Railway.

Prefix: /question-ia
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ...core.database import get_db
from ...models.user import User
from ...core.security import decode_token
from ...schemas.question_ia import (
    GerarQuestoesIARequest,
    GerarQuestoesIAResponse,
    QuestaoIA,
    AlternativaIA,
)
from ...services.subscription_service import verificar_creditos, consumir_creditos
from ...models.question_bank_fundamental import QuestionBankFundamental
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/question-ia", tags=["question-ia"])

# Tamanho fixo do lote (frontend faz requests sequenciais)
BATCH_SIZE = 4


# ============================================================
# AUTENTICAÇÃO
# ============================================================
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


# ============================================================
# CUSTO (cobrado UMA VEZ, no primeiro lote)
# ============================================================
def calcular_custo(total_questoes: int) -> int:
    """Retorna o custo em DÉCIMOS (1 crédito = 10 décimos)."""
    if total_questoes <= 10:
        return 10
    if total_questoes <= 20:
        return 20
    if total_questoes <= 30:
        return 30
    if total_questoes <= 45:
        return 40
    return 50


# ============================================================
# PALAVRAS-ÂNCORA POR COMPONENTE
# Usadas no prompt para direcionar a IA a escolher o contexto correto
# ============================================================
PALAVRAS_ANCORA_POR_COMPONENTE = {
    "MA": {
        "descricao": "Matemática",
        "palavras": [
            "dobro, triplo, metade, quádruplo (multiplicação/divisão)",
            "ao todo, juntou, arrecadaram, somaram, no total (adição)",
            "sobraram, restaram, ficou, gastou, vendeu (subtração)",
            "dividiu igualmente, cada um recebeu, repartiu (divisão)",
            "maior que, menor que, comparar (comparação)",
            "ordem crescente, ordem decrescente, organizar (sequência)",
            "decompor, algarismo, ordem, classe, valor posicional (SND)",
            "localização, deslocamento, mapa, posição (geometria)",
            "medida, comprimento, massa, capacidade, tempo (grandezas)",
        ],
    },
    "LP": {
        "descricao": "Língua Portuguesa",
        "palavras": [
            "de acordo com o texto, segundo o autor (localização explícita)",
            "infira, conclua, deduza, subentende-se (inferência)",
            "qual é o tema, do que trata o texto, assunto principal (tema)",
            "para que serve, qual a finalidade, propósito (função social)",
            "o que aconteceu primeiro, depois, em seguida (sequência narrativa)",
            "causa, consequência, por causa de, por isso (relações lógicas)",
            "o personagem sentiu, qual a intenção, o que significa (interpretação)",
            "opinião, fato, argumento, tese (argumentação)",
        ],
    },
    "CI": {
        "descricao": "Ciências da Natureza",
        "palavras": [
            "explique por que, qual a causa, o que provoca (explicação causal)",
            "compare, diferencie, quais as diferenças (comparação)",
            "identifique o processo, descreva as etapas (descrição de processos)",
            "qual seria o resultado se, preveja (previsão)",
            "como funciona, de que é feito, do que se trata (composição)",
            "qual o impacto, quais consequências ambientais (impacto socioambiental)",
        ],
    },
    "HI": {
        "descricao": "História",
        "palavras": [
            "qual o contexto histórico, em que época, qual o período (temporalidade)",
            "qual a causa, o que motivou, o que provocou (causalidade histórica)",
            "compare os períodos, diferencie as épocas (comparação histórica)",
            "quem foram os envolvidos, quais os sujeitos históricos (sujeitos)",
            "qual a consequência, o que mudou depois (mudança e permanência)",
        ],
    },
    "GE": {
        "descricao": "Geografia",
        "palavras": [
            "qual a localização, identifique no mapa, em que região (localização)",
            "compare os espaços, quais as diferenças entre lugares (comparação)",
            "qual o impacto ambiental, quais as transformações do espaço (impacto)",
            "como se relacionam, qual a interdependência (relação sociedade-natureza)",
            "qual a escala, do local ao global (escalas geográficas)",
        ],
    },
    "AR": {
        "descricao": "Arte",
        "palavras": [
            "quais elementos visuais, cores, formas, texturas (linguagem visual)",
            "qual a intenção artística, o que a obra representa (leitura de obra)",
            "compare os estilos, diferencie as linguagens artísticas (comparação)",
        ],
    },
    "EF": {
        "descricao": "Educação Física",
        "palavras": [
            "quais movimentos, qual a técnica, como executar (movimento)",
            "quais regras, como funciona o jogo (esporte)",
            "qual a importância para a saúde, benefícios (saúde)",
        ],
    },
    "ER": {
        "descricao": "Ensino Religioso",
        "palavras": [
            "qual o valor, o que representa, qual o significado (valores)",
            "compare as tradições, diferencie as práticas (diversidade religiosa)",
            "qual a importância do respeito, da convivência (convivência)",
        ],
    },
    "LI": {
        "descricao": "Língua Inglesa",
        "palavras": [
            "what does it mean, traduza, qual o significado (compreensão)",
            "complete a frase, escolha a palavra correta (vocabulário)",
            "qual a estrutura, como se forma (gramática)",
        ],
    },
}


# ============================================================
# TEMAS CONDUTORES POR COMPONENTE
# Rótulos que a IA usa para identificar o eixo pedagógico da questão
# ============================================================
TEMAS_CONDUTORES_POR_COMPONENTE = {
    "MA": [
        "QUANTIDADE", "ORDEM", "MEDIDA", "CÓDIGO DE IDENTIFICAÇÃO",
        "DIFERENCIANDO SITUAÇÕES", "ADIÇÃO", "SUBTRAÇÃO", "MULTIPLICAÇÃO",
        "DIVISÃO", "COMPARAÇÃO", "SEQUÊNCIA", "DECOMPOSIÇÃO", "VALOR POSICIONAL",
        "GEOMETRIA", "GRANDEZAS E MEDIDAS", "ESTATÍSTICA",
    ],
    "LP": [
        "LOCALIZAR", "INFERIR", "TEMA", "FINALIDADE", "SEQUÊNCIA",
        "CAUSA E CONSEQUÊNCIA", "INTERPRETAÇÃO", "ARGUMENTAÇÃO", "COESÃO",
    ],
    "CI": [
        "OBSERVAÇÃO", "EXPLICAÇÃO", "COMPARAÇÃO", "PREVISÃO", "ANÁLISE",
        "IMPACTO SOCIOAMBIENTAL",
    ],
    "HI": [
        "TEMPO", "CAUSALIDADE", "COMPARAÇÃO HISTÓRICA", "SUJEITOS",
        "MUDANÇA E PERMANÊNCIA",
    ],
    "GE": [
        "LOCALIZAÇÃO", "COMPARAÇÃO", "IMPACTO", "RELAÇÃO SOCIEDADE-NATUREZA",
        "ESCALAS",
    ],
    "AR": ["LINGUAGEM VISUAL", "LEITURA DE OBRA", "COMPARAÇÃO"],
    "EF": ["MOVIMENTO", "ESPORTE", "SAÚDE"],
    "ER": ["VALORES", "DIVERSIDADE", "CONVIVÊNCIA"],
    "LI": ["COMPREENSÃO", "VOCABULÁRIO", "GRAMÁTICA"],
}


# ============================================================
# TIPOS DE FIGURA VÁLIDOS (para o campo tipo_figura_sugerida)
# ============================================================
TIPOS_FIGURA_VALIDOS = [
    "quantidade",         # objetos contáveis: bolas, lápis, frutas
    "ordem",              # fila, pódio, estante, posição ordinal
    "medida",             # régua, balança, relógio
    "decomposicao",       # blocos de centena/dezena/unidade
    "sequencia",          # reta numérica, escada
    "comparacao",         # duas colunas lado a lado
    "objetos_escolares",  # lápis, caderno, tesoura, mochila
    "formas",             # quadrado, círculo, triângulo
    "nenhuma",            # questão não pede figura
]


# ============================================================
# ERROS COMUNS POR TIPO DE HABILIDADE (para calibrar distratores)
# ============================================================
ERROS_COMUNS_POR_TIPO = {
    "adicao": "Aluno soma mas esquece de agrupar; ou soma apenas uma parte.",
    "subtracao": "Aluno subtrai o menor do maior mesmo quando a ordem não importa; ou esquece de 'emprestar'.",
    "multiplicacao": "Aluno soma em vez de multiplicar; ou multiplica por número errado.",
    "divisao": "Aluno divide errado (metade vs. quarta parte); ou confunde divisor com dividendo.",
    "comparacao": "Aluno confunde 'maior' com 'menor'; ou compara apenas um dígito.",
    "ordem": "Aluno confunde posição ordinal com quantidade.",
    "valor_posicional": "Aluno confunde unidade/dezena/centena.",
    "leitura": "Aluno lê a informação errada por não atentar ao enunciado.",
    "inferencia": "Aluno escolhe informação explícita em vez de inferir.",
}


# ============================================================
# SYSTEM INSTRUCTION — enriquecida + campos tema/figura
# ============================================================
def montar_system_instruction() -> str:
    return (
        "Você é um especialista em avaliação educacional brasileira, com domínio "
        "profundo da BNCC, dos currículos estaduais (especialmente do Piauí), "
        "das Matrizes de Referência do SAEB e SAEPI, e da Taxonomia de Bloom.\n\n"
        "Sua tarefa é GERAR QUESTÕES INÉDITAS de múltipla escolha para compor uma prova.\n\n"
        "═══════════════════════════════════════════════════════════════\n"
        "REGRAS PEDAGÓGICAS OBRIGATÓRIAS\n"
        "═══════════════════════════════════════════════════════════════\n"
        "1. Cada questão deve estar alinhada a UM descritor específico.\n"
        "2. Respeite as quantidades solicitadas por habilidade.\n"
        "3. Use linguagem adequada à faixa etária.\n"
        "4. Frases curtas, vocabulário simples.\n"
        "5. Contextualize em situações do cotidiano brasileiro.\n"
        "6. Inclua 4 alternativas (A, B, C, D).\n"
        "7. A alternativa correta deve estar claramente correta.\n"
        "8. Os distratores NÃO devem ser absurdos.\n\n"
        "═══════════════════════════════════════════════════════════════\n"
        "REGRA CRÍTICA — DISTRATORES CALIBRADOS POR ERRO COMUM\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Cada distrator deve representar um ERRO COMUM que o aluno cometeria.\n"
        "NÃO invente distratores aleatórios. Use os seguintes erros típicos:\n"
        "• Adição: aluno soma mas esquece de agrupar; ou soma só uma parte.\n"
        "• Subtração: aluno subtrai o menor do maior mesmo quando a ordem não importa.\n"
        "• Multiplicação: aluno soma em vez de multiplicar.\n"
        "• Divisão: aluno divide errado (metade vs. quarta parte).\n"
        "• Comparação: aluno confunde 'maior' com 'menor'.\n"
        "• Ordem: aluno confunde posição ordinal com quantidade.\n"
        "• Valor posicional: aluno confunde unidade/dezena/centena.\n"
        "• Leitura: aluno lê informação errada por não atentar ao enunciado.\n"
        "• Inferência: aluno escolhe informação explícita em vez de inferir.\n\n"
        "═══════════════════════════════════════════════════════════════\n"
        "REGRA CRÍTICA — PROGRESSÃO COGNITIVA\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Dentro de cada lote, ordene as questões do mais simples para o mais complexo,\n"
        "respeitando a Taxonomia de Bloom:\n"
        "  1º Lembrar → 2º Compreender → 3º Aplicar → 4º Analisar → 5º Avaliar → 6º Criar\n\n"
        "═══════════════════════════════════════════════════════════════\n"
        "REGRA CRÍTICA — CONTEXTO COTIDIANO E CULTURAL\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Use nomes próprios brasileiros comuns (Ana, Bruno, Carla, Daniel, Elena).\n"
        "Use situações do dia a dia (escola, casa, mercado, parque, festa).\n"
        "Para o Piauí, prefira contextos regionais sem estereótipos.\n"
        "NUNCA use nomes ou contextos que possam soar excludentes.\n\n"
        "═══════════════════════════════════════════════════════════════\n"
        "REGRA CRÍTICA — TEMA CONDUTOR (obrigatório em TODA questão)\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Para CADA questão, defina um TEMA CONDUTOR. O tema é um rótulo curto\n"
        "em CAIXA ALTA que resume o eixo pedagógico da questão.\n"
        "Use EXATAMENTE um dos temas condutores listados no prompt para o componente.\n"
        "Exemplos: 'QUANTIDADE', 'ORDEM', 'MEDIDA', 'INFERIR', 'LOCALIZAR', 'COMPARAÇÃO'.\n\n"
        "═══════════════════════════════════════════════════════════════\n"
        "REGRA CRÍTICA — TIPO DE FIGURA (obrigatório em TODA questão)\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Para CADA questão, classifique o TIPO DE FIGURA sugerida como UM dos:\n"
        "  - quantidade (objetos contáveis: bolas, lápis, frutas)\n"
        "  - ordem (fila, pódio, estante, posição ordinal)\n"
        "  - medida (régua, balança, relógio)\n"
        "  - decomposicao (blocos de centena/dezena/unidade)\n"
        "  - sequencia (reta numérica, escada)\n"
        "  - comparacao (duas colunas lado a lado)\n"
        "  - objetos_escolares (lápis, caderno, tesoura, mochila)\n"
        "  - formas (quadrado, círculo, triângulo)\n"
        "  - nenhuma (questão não pede figura)\n\n"
        "SUPORTE VISUAL\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Para cada questão, indique se ela precisa de ilustração.\n"
        "Se precisar, descreva em português o que deve ser ilustrado.\n"
        "Use termos simples e reconhecíveis.\n\n"
        "FORMATO DE SAÍDA (JSON)\n"
        "═══════════════════════════════════════════════════════════════\n"
        "{\n"
        '  "questoes": [\n'
        "    {\n"
        '      "numero": 1,\n'
        '      "habilidade_codigo": "EF02MA01",\n'
        '      "habilidade_texto": "...",\n'
        '      "descritor": "D01",\n'
        '      "descritor_texto": "...",\n'
        '      "nivel_cognitivo": "Aplicar",\n'
        '      "tipo": "multipla_escolha",\n'
        '      "tema_condutor": "QUANTIDADE",\n'
        '      "tipo_figura_sugerida": "quantidade",\n'
        '      "enunciado": "...",\n'
        '      "alternativas": [\n'
        '        {"letra": "A", "texto": "..."},\n'
        '        {"letra": "B", "texto": "..."},\n'
        '        {"letra": "C", "texto": "..."},\n'
        '        {"letra": "D", "texto": "..."}\n'
        "      ],\n"
        '      "gabarito": "B",\n'
        '      "explicacao_gabarito": "...",\n'
        '      "precisa_ilustracao": true,\n'
        '      "descricao_ilustracao": "Uma caixa com 12 lápis de cor"\n'
        "    }\n"
        "  ]\n"
        "}"
    )


# ============================================================
# PROMPT BASE
# ============================================================
def montar_prompt_base(data: GerarQuestoesIARequest, batch_start: int, batch_end: int) -> str:
    prompt = "DADOS DA PROVA:\n"
    prompt += f"Título: {data.titulo}\n"
    prompt += f"Etapa: {data.etapa}\n"
    if data.ano:
        prompt += f"Ano: {data.ano}º ano\n"
    if data.serie:
        prompt += f"Série/Turma: {data.serie}\n"
    prompt += f"Componente: {data.disciplina_nome or data.componente}\n"

    # ----------------------------------------------------------
    # Referenciais ativos (multi-seleção com retrocompatibilidade)
    # ----------------------------------------------------------
    refs = data.referenciais if data.referenciais else [data.referencial]
    refs = [r for r in refs if r]

    INSTRUCOES_REFERENCIAL = {
        "bncc": "BNCC — Use as habilidades oficiais como base principal da questão.",
        "curriculo_piaui": "Currículo do Piauí — Considere os complementos regionais (.NPI) e o contexto local do Piauí.",
        "saeb": "SAEB — Gere a questão no estilo da avaliação SAEB, utilizando os descritores indicados.",
        "saepi": "SAEPI — Gere a questão no estilo da avaliação SAEPI, utilizando os descritores indicados.",
        "ppaic": "PPAIC — Priorize o contexto de alfabetização na idade certa (1º e 2º ano).",
    }

    prompt += "\nREFERENCIAIS ATIVOS PARA ESTA PROVA:\n"
    for r in refs:
        instr = INSTRUCOES_REFERENCIAL.get(r)
        if instr:
            prompt += f"• {instr}\n"
    prompt += "\n"

    # ----------------------------------------------------------
    # ENRIQUECIMENTO 1 — palavras-âncora e temas condutores por componente
    # ----------------------------------------------------------
    comp = (data.componente or "").upper()
    if comp in PALAVRAS_ANCORA_POR_COMPONENTE:
        info = PALAVRAS_ANCORA_POR_COMPONENTE[comp]
        prompt += f"\nPALAVRAS-ÂNCORA PARA {info['descricao'].upper()}:\n"
        prompt += "Use as palavras-chave abaixo para escolher o contexto correto:\n"
        for palavra in info["palavras"]:
            prompt += f"  • {palavra}\n"

    if comp in TEMAS_CONDUTORES_POR_COMPONENTE:
        temas = TEMAS_CONDUTORES_POR_COMPONENTE[comp]
        prompt += f"\nTEMAS CONDUTORES VÁLIDOS PARA {comp}:\n"
        prompt += "Use EXATAMENTE um destes rótulos em cada questão (em caixa alta):\n"
        prompt += f"  {', '.join(temas)}\n"

    prompt += "\nTIPOS DE FIGURA VÁLIDOS (use EXATAMENTE um por questão, no campo 'tipo_figura_sugerida'):\n"
    prompt += f"  {', '.join(TIPOS_FIGURA_VALIDOS)}\n"

    # ----------------------------------------------------------
    # ENRIQUECIMENTO 2 — erros comuns para calibrar distratores
    # ----------------------------------------------------------
    prompt += "\nERROS COMUNS A CONSIDERAR NOS DISTRATORES:\n"
    for tipo, descricao in ERROS_COMUNS_POR_TIPO.items():
        prompt += f"  • {tipo}: {descricao}\n"

    # ----------------------------------------------------------
    # Habilidades, descritores e nível cognitivo
    # ----------------------------------------------------------
    prompt += "\nHABILIDADES, DESCRITORES E NÍVEL COGNITIVO:\n"
    for i, h in enumerate(data.habilidades, start=1):
        prompt += f"\nHABILIDADE {i} — {h.codigo} (gerar {h.quantidade} questão/questões no total)\n"
        if h.texto:
            prompt += f"Texto BNCC: {h.texto}\n"
        if h.complemento_pi:
            prompt += f"Complemento do Currículo do Piauí: {h.complemento_pi}\n"
        if h.descritores:
            prompt += f"Descritores associados: {', '.join(h.descritores)}\n"
            prompt += (
                "  ⚠️ IMPORTANTE: cada questão gerada deve ter como EIXO CENTRAL "
                "o descritor selecionado. A resposta correta deve corresponder "
                "exatamente ao que o descritor avalia.\n"
            )
        if h.unidade_tematica:
            prompt += f"Unidade Temática (BNCC): {h.unidade_tematica}\n"
        if h.objeto_conhecimento:
            prompt += f"Objeto de Conhecimento (BNCC): {h.objeto_conhecimento}\n"
        if h.nivel_cognitivo:
            prompt += f"Nível cognitivo (Bloom): {h.nivel_cognitivo}\n"
        if h.dificuldade:
            prompt += f"Dificuldade desejada: {h.dificuldade}\n"

    if data.estado and data.estado.upper() == "PI":
        prompt += (
            "\nCONTEXTO REGIONAL (PIAUÍ):\n"
            "O professor é do Piauí. Sempre que possível, use contextos regionais: "
            "nomes de cidades piauienses (Teresina, Parnaíba, Picos, Floriano), "
            "fauna/flora do Cerrado e Caatinga, cultura local. "
            "NUNCA use estereótipos regionais.\n"
        )

    if data.incluir_ilustracoes:
        prompt += (
            "\nSUPORTE VISUAL:\n"
            "Para cada questão, indique se precisa de ilustração "
            "(precisa_ilustracao: true/false) e descreva em português o que deve ser "
            "ilustrado (descricao_ilustracao). Use termos simples.\n"
        )

    # Instrução específica deste lote
    qtd = batch_end - batch_start + 1
    prompt += (
        f"\n═══════════════════════════════════════════════════════════════\n"
        f"INSTRUÇÃO DESTE LOTE\n"
        f"═══════════════════════════════════════════════════════════════\n"
        f"Gere EXATAMENTE {qtd} questão(ões) neste lote, numeradas de "
        f"{batch_start} a {batch_end}.\n"
        f"Ordene-as do mais SIMPLES para o mais COMPLEXO (progressão cognitiva).\n"
        f"TODA questão deve ter os campos 'tema_condutor' e 'tipo_figura_sugerida' preenchidos.\n"
        f"Se houver mais de uma habilidade, distribua as questões entre elas.\n"
        f"Retorne APENAS o JSON, sem texto adicional.\n"
    )

    return prompt


# ============================================================
# ENDPOINT — GERAR LOTE
# ============================================================
@router.post("/gerar", response_model=GerarQuestoesIAResponse)
def gerar_questoes(
    data: GerarQuestoesIARequest,
    batch_start: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Gera UM LOTE de questões (máximo 4).
    O frontend faz requests sequenciais para cobrir o total desejado.

    Parâmetros:
      - batch_start: número da primeira questão deste lote (1-based)
      - BATCH_SIZE: 4 (fixo no backend)
    """
    # ------------------------------------------------------------
    # 1. Validações
    # ------------------------------------------------------------
    if data.etapa not in ("EI", "EF"):
        raise HTTPException(status_code=400, detail="Etapa deve ser 'EI' ou 'EF'.")

    total_questoes = sum(h.quantidade for h in data.habilidades)
    if total_questoes < 1:
        raise HTTPException(status_code=400, detail="Adicione ao menos 1 questão.")
    if total_questoes > 60:
        raise HTTPException(
            status_code=400,
            detail="Máximo de 60 questões por geração.",
        )

    if batch_start < 1 or batch_start > total_questoes:
        raise HTTPException(status_code=400, detail="batch_start inválido.")

    batch_end = min(batch_start + BATCH_SIZE - 1, total_questoes)

    # ------------------------------------------------------------
    # 2. Verificar créditos APENAS no primeiro lote
    # ------------------------------------------------------------
    is_primeiro_lote = (batch_start == 1)
    custo_decimos = calcular_custo(total_questoes) if is_primeiro_lote else 0

    if is_primeiro_lote:
        pode, _ = verificar_creditos(
            db,
            str(current_user.id),
            "gerar_questoes_ia",
            diferenciado=(custo_decimos > 10),
        )
        if not pode:
            raise HTTPException(
                status_code=402,
                detail="Créditos insuficientes. Faça upgrade do seu plano.",
            )

    # ------------------------------------------------------------
    # 3. Chamar a IA
    # ------------------------------------------------------------
    try:
        from ...services.gemini_service import get_gemini_service
        service = get_gemini_service()

        questoes_raw = service.generate_questions_batch(
            system_instruction=montar_system_instruction(),
            base_prompt=montar_prompt_base(data, batch_start, batch_end),
            total_questoes=batch_end - batch_start + 1,
            batch_size=batch_end - batch_start + 1,
        )
    except Exception as e:
        print(f"[Motor 9] Erro ao gerar lote {batch_start}-{batch_end}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar questões. Tente novamente.",
        )

    if not questoes_raw:
        raise HTTPException(status_code=500, detail="A IA não retornou questões.")

    # ------------------------------------------------------------
    # 4. Converter para o schema
    # ------------------------------------------------------------
    questoes_out: List[QuestaoIA] = []
    for i, q in enumerate(questoes_raw, start=batch_start):
        alternativas = []
        for alt in q.get("alternativas", []):
            if isinstance(alt, dict) and "letra" in alt:
                alternativas.append(AlternativaIA(
                    letra=str(alt.get("letra", "")),
                    texto=str(alt.get("texto", "")),
                ))

        # Normaliza tema_condutor e tipo_figura_sugerida (Fase 2b)
        tema_condutor = q.get("tema_condutor")
        if isinstance(tema_condutor, str):
            tema_condutor = tema_condutor.strip().upper() or None
        else:
            tema_condutor = None

        tipo_figura = q.get("tipo_figura_sugerida")
        if isinstance(tipo_figura, str):
            tipo_figura = tipo_figura.strip().lower() or None
            # Se vier algo fora da lista, mantém como None para não poluir
            if tipo_figura and tipo_figura not in TIPOS_FIGURA_VALIDOS:
                tipo_figura = None
        else:
            tipo_figura = None

        questoes_out.append(QuestaoIA(
            numero=i,
            habilidade_codigo=q.get("habilidade_codigo", ""),
            habilidade_texto=q.get("habilidade_texto"),
            unidade_tematica=q.get("unidade_tematica"),
            objeto_conhecimento=q.get("objeto_conhecimento"),
            descritor=q.get("descritor"),
            descritor_texto=q.get("descritor_texto"),
            nivel_cognitivo=q.get("nivel_cognitivo"),
            tipo=q.get("tipo", "multipla_escolha"),
            enunciado=q.get("enunciado", ""),
            alternativas=alternativas,
            gabarito=q.get("gabarito", ""),
            explicacao_gabarito=q.get("explicacao_gabarito"),
            precisa_ilustracao=bool(q.get("precisa_ilustracao", False)),
            descricao_ilustracao=q.get("descricao_ilustracao"),
            icone_sugerido=None,
            origem="gerada_ia",
            tema_condutor=tema_condutor,
            tipo_figura_sugerida=tipo_figura,
        ))

    # ------------------------------------------------------------
    # 5. Consumir créditos (só no primeiro lote)
    # ------------------------------------------------------------
    if is_primeiro_lote:
        consumir_creditos(db, str(current_user.id), "gerar_questoes_ia", custo_decimos)

    # ------------------------------------------------------------
    # 6. Retorno
    # ------------------------------------------------------------
    return GerarQuestoesIAResponse(
        sucesso=True,
        mensagem=f"Lote {batch_start}-{batch_end}: {len(questoes_out)} questão(ões).",
        total_questoes=len(questoes_out),
        questoes=questoes_out,
        creditos_consumidos=custo_decimos / 10.0,
        metadados={
            "batch_start": batch_start,
            "batch_end": batch_end,
            "is_primeiro_lote": is_primeiro_lote,
            "total_solicitado": total_questoes,
        },
    )


# ============================================================
# CURADORIA — envia questões aprovadas para o banco comum
# ============================================================
class EnviarCuradoriaRequest(BaseModel):
    etapa: str
    ano: Optional[int] = None
    serie: Optional[str] = None
    componente: str
    disciplina_nome: Optional[str] = None
    referencial: Optional[str] = "bncc"
    referenciais: Optional[List[str]] = None
    estado: Optional[str] = None
    dificuldade_padrao: Optional[str] = None
    questoes: List[Dict[str, Any]]


class EnviarCuradoriaResponse(BaseModel):
    sucesso: bool
    total_enviado: int
    mensagem: str


@router.post("/enviar-curadoria", response_model=EnviarCuradoriaResponse)
def enviar_curadoria(
    data: EnviarCuradoriaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Envia questões para a fila de curadoria (banco comum).
    As questões são inseridas com approved=False e aguardam aprovação do admin.
    """
    if not data.questoes:
        raise HTTPException(status_code=400, detail="Nenhuma questão para enviar.")

    # Normaliza referenciais (multi-seleção com retrocompatibilidade)
    refs = data.referenciais if data.referenciais else ([data.referencial] if data.referencial else ["bncc"])
    refs = [r for r in refs if r]
    referencial_principal = refs[0] if refs else "bncc"
    referencias_extras = refs[1:] if len(refs) > 1 else None

    total = 0
    for q in data.questoes:
        try:
            nova = QuestionBankFundamental(
                id=uuid.uuid4(),
                fonte="SIMIDNAPE_IA",
                ano=data.ano,
                etapa=data.etapa,
                serie=data.serie,
                componente=data.componente,
                disciplina=data.disciplina_nome or data.componente,
                unidade_tematica=q.get("unidade_tematica"),
                objeto_conhecimento=q.get("objeto_conhecimento"),
                numero=q.get("numero"),
                tipo=q.get("tipo", "multipla_escolha"),
                enunciado=q.get("enunciado", ""),
                alternativas=q.get("alternativas", []),
                gabarito=q.get("gabarito"),
                imagem_url=q.get("imagem_url"),
                imagens_extras=None,
                habilidades=[q.get("habilidade_codigo")] if q.get("habilidade_codigo") else None,
                habilidade_codigo=q.get("habilidade_codigo"),
                referencial=referencial_principal,
                referencias_extras=referencias_extras,
                descritores=[q.get("descritor")] if q.get("descritor") else None,
                dificuldade=q.get("dificuldade") or data.dificuldade_padrao,
                origem="gerada_ia",
                submitted_by=current_user.id,
                approved=False,
                anulada=False,
            )
            db.add(nova)
            total += 1
        except Exception as e:
            print(f"[Curadoria] Erro ao inserir questão: {e}")
            continue

    db.commit()

    return EnviarCuradoriaResponse(
        sucesso=True,
        total_enviado=total,
        mensagem=f"{total} questão(ões) enviada(s) para curadoria.",
    )


# ============================================================
# BANCO DE FIGURAS — Motor 9 lê as figuras sugeridas
# ============================================================
@router.get("/figuras")
def listar_figuras_para_motor9(
    categoria: str = Query(..., description="Categoria pedagógica (ex: quantidade, ordem, medida)"),
    limit: int = Query(8, ge=1, le=30, description="Máximo de figuras a retornar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista figuras aprovadas do Banco de Figuras (figure_bank) por categoria.
    Retorna data URLs (base64) prontos para exibir no navegador.

    Usado pelo Motor 9 para mostrar sugestões de figuras ao professor
    quando ele escolhe a opção "✨ Automática".

    Fallback: se a categoria estiver vazia no banco, o frontend cai
    automaticamente para os SVGs locais (frontend/public/icons).
    """
    from ...models.figure_bank import FigureBank
    import base64
    from sqlalchemy import or_, func

    if not categoria:
        raise HTTPException(status_code=400, detail="Categoria obrigatória.")

    # Busca figuras aprovadas que tenham a categoria na lista JSONB
    # ou no campo legado "categoria"
    query = (
        db.query(FigureBank)
        .filter(
            FigureBank.aprovada == True,
            or_(
                FigureBank.categorias.cast(func.text).ilike(f'%"{categoria}"%'),
                FigureBank.categoria == categoria,
            ),
        )
        .order_by(FigureBank.created_at.desc())
        .limit(limit)
    )

    figuras = query.all()

    resultado = []
    for f in figuras:
        try:
            b64 = base64.b64encode(f.file_data).decode("utf-8")
            data_url = f"data:{f.mime_type};base64,{b64}"
            resultado.append({
                "id": str(f.id),
                "nome": f.nome,
                "dataUrl": data_url,
                "mime_type": f.mime_type,
            })
        except Exception as e:
            print(f"[Figuras] Erro ao converter figura {f.id}: {e}")
            continue

    return {
        "categoria": categoria,
        "total": len(resultado),
        "figuras": resultado,
    }