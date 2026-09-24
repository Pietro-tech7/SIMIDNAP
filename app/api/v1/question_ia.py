"""
Rotas do Motor 9 — Banco de Questões IA.

Gera questões inéditas com Google Gemini, alinhadas à BNCC, Currículo do
Piauí, SAEB e SAEPI. Suporta sugestão de ícones e múltiplas habilidades.

Prefix: /question-ia
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
import re

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

router = APIRouter(prefix="/question-ia", tags=["question-ia"])


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
# REGRAS DE CUSTO
# ============================================================
def calcular_custo(total_questoes: int) -> int:
    """Retorna o custo em DÉCIMOS de crédito (1 crédito = 10 décimos)."""
    if total_questoes <= 10:
        return 10  # 1 crédito
    if total_questoes <= 20:
        return 20  # 2 créditos
    if total_questoes <= 30:
        return 30  # 3 créditos
    return 40  # 4 créditos (limite máximo)


# ============================================================
# MONTAGEM DO PROMPT
# ============================================================
def montar_prompt(data: GerarQuestoesIARequest) -> str:
    """Monta o prompt completo enviado à IA (5 camadas)."""
    total = sum(h.quantidade for h in data.habilidades)

    # ------------------------------------------------------------
    # Camada 1 — Identidade
    # ------------------------------------------------------------
    prompt = (
        "Você é um especialista em avaliação educacional brasileira, com domínio "
        "profundo da BNCC, dos currículos estaduais (especialmente do Piauí), "
        "das Matrizes de Referência do SAEB e SAEPI, e da Taxonomia de Bloom.\n\n"
        "Sua tarefa é GERAR QUESTÕES INÉDITAS de múltipla escolha para compor uma prova.\n"
    )

    # ------------------------------------------------------------
    # Camada 2 — Dados da prova
    # ------------------------------------------------------------
    prompt += (
        "\n═══════════════════════════════════════════════════════════════\n"
        "DADOS DA PROVA\n"
        "═══════════════════════════════════════════════════════════════\n"
        f"Título: {data.titulo}\n"
        f"Etapa: {data.etapa}\n"
    )
    if data.ano:
        prompt += f"Ano: {data.ano}º ano\n"
    if data.serie:
        prompt += f"Série/Turma: {data.serie}\n"
    prompt += f"Componente: {data.disciplina_nome or data.componente}\n"
    prompt += f"Referencial principal: {data.referencial}\n"
    prompt += f"Total de questões a gerar: {total}\n"
    prompt += f"Incluir ilustrações: {'SIM' if data.incluir_ilustracoes else 'NÃO'}\n"

    # ------------------------------------------------------------
    # Camada 3 — Habilidades, descritores e nível cognitivo
    # ------------------------------------------------------------
    prompt += (
        "\n═══════════════════════════════════════════════════════════════\n"
        "HABILIDADES, DESCRITORES E NÍVEL COGNITIVO\n"
        "═══════════════════════════════════════════════════════════════\n"
    )
    for i, h in enumerate(data.habilidades, start=1):
        prompt += f"\nHABILIDADE {i} — {h.codigo} (gerar {h.quantidade} questão/questões)\n"
        if h.texto:
            prompt += f"Texto BNCC: {h.texto}\n"
        if h.complemento_pi:
            prompt += f"Complemento do Currículo do Piauí: {h.complemento_pi}\n"
        if h.descritores:
            prompt += f"Descritores associados: {', '.join(h.descritores)}\n"
        if h.nivel_cognitivo:
            prompt += f"Nível cognitivo (Bloom): {h.nivel_cognitivo}\n"

    # ------------------------------------------------------------
    # Camada 4 — Contexto regional
    # ------------------------------------------------------------
    if data.estado and data.estado.upper() == "PI":
        prompt += (
            "\n═══════════════════════════════════════════════════════════════\n"
            "CONTEXTO REGIONAL (PIAUÍ)\n"
            "═══════════════════════════════════════════════════════════════\n"
            "O professor é do Piauí. Sempre que possível, use contextos regionais: "
            "nomes de cidades piauienses (Teresina, Parnaíba, Picos, Floriano), "
            "fauna/flora do Cerrado e Caatinga, cultura local (festas juninas, "
            "artesanato, culinária). NUNCA use estereótipos regionais.\n"
        )

    # ------------------------------------------------------------
    # Camada 5 — Regras pedagógicas + suporte visual
    # ------------------------------------------------------------
    prompt += (
        "\n═══════════════════════════════════════════════════════════════\n"
        "REGRAS PEDAGÓGICAS\n"
        "═══════════════════════════════════════════════════════════════\n"
        "1. Cada questão deve estar alinhada a UM descritor específico.\n"
        "2. Respeite as quantidades solicitadas por habilidade.\n"
        "3. Use linguagem adequada à faixa etária.\n"
        "4. Frases curtas, vocabulário simples.\n"
        "5. Contextualize em situações do cotidiano da criança.\n"
        "6. Inclua 4 alternativas (A, B, C, D).\n"
        "7. A alternativa correta deve estar claramente correta.\n"
        "8. Os distratores devem ser plausíveis (não absurdos).\n"
    )

    if data.incluir_ilustracoes:
        prompt += (
            "\n═══════════════════════════════════════════════════════════════\n"
            "REGRAS DE SUPORTE VISUAL\n"
            "═══════════════════════════════════════════════════════════════\n"
            "9. Para cada questão, indique se ela precisa de ilustração.\n"
            "10. Se precisar, descreva em português o que deve ser ilustrado.\n"
            "    Use termos simples e reconhecíveis (lápis, bola, carrinho, "
            "quadrado, círculo, cachorro, criança, escola, número).\n"
            "11. NUNCA invente ícones complexos. Prefira ícones simples.\n"
            "12. Se não precisar, deixe a descrição vazia.\n"
        )

    # ------------------------------------------------------------
    # Camada 6 — Formato de saída
    # ------------------------------------------------------------
    prompt += (
        "\n═══════════════════════════════════════════════════════════════\n"
        "FORMATO DE SAÍDA (JSON)\n"
        "═══════════════════════════════════════════════════════════════\n"
        "Retorne APENAS um JSON válido, sem texto antes ou depois, sem ```, "
        "neste formato exato:\n\n"
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
        "}\n"
    )

    return prompt


# ============================================================
# LIMPEZA E PARSE DA RESPOSTA
# ============================================================
def _limpar_json(texto: str) -> str:
    """Remove marcações markdown e texto fora do JSON."""
    texto = texto.strip()
    if texto.startswith("```"):
        partes = texto.split("```")
        for p in partes:
            p = p.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                return p
    # Pega do primeiro { até o último }
    inicio = texto.find("{")
    fim = texto.rfind("}")
    if inicio != -1 and fim != -1 and fim > inicio:
        return texto[inicio:fim+1]
    return texto


def _parse_resposta(texto: str) -> List[Dict[str, Any]]:
    """Converte o texto da IA em lista de questões."""
    texto_limpo = _limpar_json(texto)
    try:
        dados = json.loads(texto_limpo)
    except json.JSONDecodeError as e:
        raise ValueError(f"Resposta da IA não é JSON válido: {e}")

    if isinstance(dados, dict) and "questoes" in dados:
        return dados["questoes"]
    if isinstance(dados, list):
        return dados
    raise ValueError("Estrutura inesperada na resposta da IA.")


# ============================================================
# ENDPOINT — GERAR QUESTÕES
# ============================================================
@router.post("/gerar", response_model=GerarQuestoesIAResponse)
def gerar_questoes(
    data: GerarQuestoesIARequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Gera questões inéditas com IA, conforme parâmetros fornecidos.
    Custo: 1 a 4 créditos, conforme quantidade total.
    """
    # ------------------------------------------------------------
    # 1. Validação básica
    # ------------------------------------------------------------
    if data.etapa not in ("EI", "EF"):
        raise HTTPException(status_code=400, detail="Etapa deve ser 'EI' ou 'EF'.")

    total_questoes = sum(h.quantidade for h in data.habilidades)
    if total_questoes < 1 or total_questoes > 40:
        raise HTTPException(status_code=400, detail="Total de questões deve ser entre 1 e 40.")

    # ------------------------------------------------------------
    # 2. Verificar créditos
    # ------------------------------------------------------------
    custo_decimos = calcular_custo(total_questoes)
    pode, _ = verificar_creditos(
        db,
        str(current_user.id),
        "gerar_questoes_ia",
        diferenciado=(custo_decimos > 10),
    )
    if not pode:
        raise HTTPException(
            status_code=402,
            detail="Créditos insuficientes. Faça upgrade do seu plano para continuar.",
        )

    # ------------------------------------------------------------
    # 3. Montar prompt e chamar IA
    # ------------------------------------------------------------
    prompt = montar_prompt(data)

    try:
        from ...services.gemini_service import get_gemini_service
        service = get_gemini_service()

        # Chama a IA com o prompt e com um "system" específico do Motor 9
        texto_resposta = service.generate_chat(
            messages=[{"role": "user", "content": prompt}],
            direcionamento_estagio=(
                "Você é um gerador de questões pedagógicas. "
                "Sempre retorne APENAS um JSON válido, sem texto antes ou depois, "
                "seguindo exatamente o formato solicitado."
            ),
        )
    except Exception as e:
        print(f"[Motor 9] Erro ao chamar IA: {e}")
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar questões. Tente novamente em alguns instantes.",
        )

    # ------------------------------------------------------------
    # 4. Parsear resposta
    # ------------------------------------------------------------
    try:
        questoes_raw = _parse_resposta(texto_resposta)
    except ValueError as e:
        print(f"[Motor 9] Erro ao parsear: {e}\n--- Resposta: {texto_resposta[:500]}")
        raise HTTPException(
            status_code=500,
            detail="A IA retornou um formato inesperado. Tente novamente.",
        )

    # ------------------------------------------------------------
    # 5. Converter para o schema de saída
    # ------------------------------------------------------------
    questoes_out: List[QuestaoIA] = []
    for i, q in enumerate(questoes_raw, start=1):
        alternativas = []
        for alt in q.get("alternativas", []):
            if isinstance(alt, dict) and "letra" in alt:
                alternativas.append(AlternativaIA(
                    letra=str(alt.get("letra", "")),
                    texto=str(alt.get("texto", "")),
                ))

        questoes_out.append(QuestaoIA(
            numero=i,
            habilidade_codigo=q.get("habilidade_codigo", ""),
            habilidade_texto=q.get("habilidade_texto"),
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
            icone_sugerido=None,  # preenchido no Bloco 4.4
            origem="gerada_ia",
        ))

    if not questoes_out:
        raise HTTPException(status_code=500, detail="A IA não retornou questões.")

    # ------------------------------------------------------------
    # 6. Consumir créditos
    # ------------------------------------------------------------
    consumir_creditos(db, str(current_user.id), "gerar_questoes_ia", custo_decimos)

    # ------------------------------------------------------------
    # 7. Retorno
    # ------------------------------------------------------------
    return GerarQuestoesIAResponse(
        sucesso=True,
        mensagem=f"{len(questoes_out)} questão(ões) gerada(s) com sucesso.",
        total_questoes=len(questoes_out),
        questoes=questoes_out,
        creditos_consumidos=custo_decimos / 10.0,
        metadados={
            "total_solicitado": total_questoes,
            "total_gerado": len(questoes_out),
            "custo_decimos": custo_decimos,
            "compartilhar_curadoria": data.compartilhar_curadoria,
        },
    )