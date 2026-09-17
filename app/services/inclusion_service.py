"""
Serviço de Estratégias Pedagógicas Inclusivas.

Detecta menções a necessidades específicas no texto do professor e retorna
estratégias pedagógicas concretas, baseadas em educação inclusiva e DUA
(Desenho Universal para Aprendizagem).

IMPORTANTE: Este serviço NÃO faz diagnósticos. Ele apenas sugere adaptações
pedagógicas com base no que o professor relata.
"""

from typing import List, Dict, Any


# ============================================================
# MAPA DE ESTRATÉGIAS POR CONDIÇÃO
# ============================================================
ESTRATEGIAS = {
    "autismo": {
        "nome": "Transtorno do Espectro Autista (TEA)",
        "palavras_chave": ["autismo", "autista", "tea", "asperger", "espectro autista"],
        "estrategias": [
            "Mantenha uma rotina previsível: escreva a sequência da aula na lousa para o aluno acompanhar.",
            "Use apoio visual: imagens, esquemas e cartões com instruções em vez de longas explicações orais.",
            "Dê instruções curtas e concretas: uma ação por frase, sem metáforas ou duplo sentido.",
            "Avise antes de qualquer transição: 'Daqui a 2 minutos vamos para a próxima etapa'.",
            "Ofereça opção de resposta não verbal: escrever, apontar ou usar cartões de resposta.",
            "Crie um espaço com menos estímulos visuais/auditivos perto de você.",
            "Antecipe mudanças de rotina: se houver atividade diferente, avise com antecedência.",
        ],
    },
    "tdah": {
        "nome": "Transtorno de Déficit de Atenção e Hiperatividade (TDAH)",
        "palavras_chave": ["tdah", "déficit de atenção", "hiperatividade", "hiperativo", "desatento", "impulsivo"],
        "estrategias": [
            "Divida tarefas longas em blocos curtos de 5-10 minutos com checkpoints visíveis.",
            "Dê instruções breves e diretas: uma instrução por vez, sem rodeios.",
            "Posicione o aluno próximo a você, longe de janelas e portas.",
            "Ofereça pausas de movimento a cada 10-15 minutos: levantar, buscar material, alongar.",
            "Valide positivamente o autocontrole: elogie quando espera a vez ou termina uma tarefa.",
            "Use sinais discretos para redirecionar a atenção sem expor o aluno.",
            "Atribua funções práticas na aula: distribuir material, apagar a lousa, ser o 'cronometrista'.",
        ],
    },
    "toc": {
        "nome": "Transtorno Obsessivo-Compulsivo (TOC)",
        "palavras_chave": ["toc", "transtorno obsessivo", "compulsivo", "obsessão", "compulsão"],
        "estrategias": [
            "Mantenha estrutura previsível: o aluno precisa saber o que vem a seguir.",
            "Avise antes de qualquer mudança de atividade ou de organização da sala.",
            "Ofereça parâmetros flexíveis para entrega de trabalhos: tempo estendido, formato alternativo.",
            "Evite pressionar ou corrigir publicamente comportamentos repetitivos.",
            "Valide emocionalmente sem reforçar a compulsão: 'Entendo que isso te incomoda. Vamos juntos.'",
            "Permita pausas curtas quando o aluno demonstrar necessidade de se reorganizar.",
            "Reduza estímulos visuais excessivos no espaço próximo ao aluno.",
        ],
    },
    "dislexia": {
        "nome": "Dislexia",
        "palavras_chave": ["dislexia", "disléxico", "dificuldade de leitura", "troca letras"],
        "estrategias": [
            "Reforce instruções oralmente além de escrever na lousa.",
            "Use textos com fonte ampliada, espaçamento maior e parágrafos curtos.",
            "Ofereça apoio com áudio: leia em voz alta ou permita uso de audiolivro.",
            "Estenda o tempo para leitura e escrita sem penalizar.",
            "Evite pedir leitura pública sem preparo prévio.",
            "Permita resposta oral em vez de escrita quando possível.",
        ],
    },
    "discalculia": {
        "nome": "Discalculia",
        "palavras_chave": ["discalculia", "dificuldade matemática", "dificuldade com números", "não entende matemática"],
        "estrategias": [
            "Use material concreto para todos os conceitos abstratos (tampinhas, palitos, blocos).",
            "Permita uso de calculadora para focar no raciocínio, não no cálculo.",
            "Fracione problemas matemáticos em etapas menores.",
            "Use apoio visual: reta numérica, tabela de multiplicação, esquemas coloridos.",
            "Dê tempo extra para resolução.",
            "Verifique a compreensão oral antes de pedir registro escrito.",
        ],
    },
    "deficiencia_visual": {
        "nome": "Deficiência Visual (cegueira ou baixa visão)",
        "palavras_chave": ["deficiência visual", "cegueira", "cego", "baixa visão", "visão reduzida"],
        "estrategias": [
            "Descreva verbalmente tudo o que escreve ou mostra na lousa.",
            "Forneça material em Braille, fonte ampliada ou áudio, conforme a necessidade.",
            "Use materiais táteis e tridimensionais para conceitos abstratos.",
            "Posicione o aluno na frente, com boa iluminação.",
            "Permita uso de tecnologia assistiva: leitor de tela, lupa eletrônica.",
        ],
    },
    "deficiencia_auditiva": {
        "nome": "Deficiência Auditiva (surdez ou baixa audição)",
        "palavras_chave": ["deficiência auditiva", "surdo", "surdez", "baixa audição", "não ouve", "libras"],
        "estrategias": [
            "Fale de frente para o aluno, com clareza e sem cobrir a boca.",
            "Use apoio visual para todas as instruções: escreva na lousa, use imagens, esquemas.",
            "Repita as perguntas dos colegas para que o aluno acompanhe a discussão.",
            "Ofereça material escrito complementar para acompanhamento.",
            "Se houver intérprete de Libras, posicione-o próximo ao professor e à lousa.",
        ],
    },
    "deficiencia_intelectual": {
        "nome": "Deficiência Intelectual",
        "palavras_chave": ["deficiência intelectual", "di", "deficiência cognitiva", "atraso cognitivo", "dificuldade de compreensão"],
        "estrategias": [
            "Simplifique a linguagem: frases curtas, vocabulário acessível.",
            "Use exemplos concretos e do cotidiano antes de qualquer abstração.",
            "Fracione cada tarefa em passos muito pequenos, com verificação a cada passo.",
            "Ofereça apoio visual e material manipulável em todas as etapas.",
            "Dê tempo estendido e permita respostas orais ou por apontamento.",
            "Trabalhe em dupla com colega de apoio.",
        ],
    },
    "altas_habilidades": {
        "nome": "Altas Habilidades / Superdotação",
        "palavras_chave": ["altas habilidades", "superdotação", "superdotado", "ahsd", "gênio", "avançado"],
        "estrategias": [
            "Ofereça desafios extras e mais complexos após a atividade principal.",
            "Permita que o aluno atue como monitor ou tutor de colegas.",
            "Proponha projetos de aprofundamento ou pesquisa independente.",
            "Dê liberdade para escolher o formato de apresentação dos resultados.",
            "Evite repetição desnecessária: se ele já domina, avance para algo novo.",
        ],
    },
    "ansiedade": {
        "nome": "Ansiedade",
        "palavras_chave": ["ansiedade", "ansioso", "crise de ansiedade", "pânico", "medo"],
        "estrategias": [
            "Crie um ambiente previsível e acolhedor, com regras claras.",
            "Avise antes de atividades que envolvam exposição (apresentações, leitura pública).",
            "Ofereça opção de resposta escrita em vez de oral quando o aluno estiver ansioso.",
            "Permita pausas curtas para autorregulação.",
            "Evite pressão de tempo: dê prazos flexíveis quando possível.",
        ],
    },
    "transtorno_processamento_sensorial": {
        "nome": "Transtorno de Processamento Sensorial",
        "palavras_chave": ["processamento sensorial", "sensorial", "hipersensível", "barulho", "textura", "luz"],
        "estrategias": [
            "Reduza ruídos, luzes intensas e estímulos visuais excessivos próximos ao aluno.",
            "Ofereça opção de usar fones abafadores de som.",
            "Permita que o aluno se sente em local com menos circulação de pessoas.",
            "Avise antes de atividades com texturas, sons ou cheiros fortes.",
            "Ofereça objetos de autorregulação (squeeze, massinha) se necessário.",
        ],
    },
}


# ============================================================
# FUNÇÕES PRINCIPAIS
# ============================================================
def detectar_necessidades(texto: str) -> List[Dict[str, Any]]:
    """
    Detecta menções a condições no texto do professor.
    Retorna uma lista de condições encontradas com suas estratégias.
    """
    if not texto:
        return []

    texto_lower = texto.lower()
    encontradas = []

    for chave, dados in ESTRATEGIAS.items():
        for palavra in dados["palavras_chave"]:
            if palavra in texto_lower:
                encontradas.append({
                    "chave": chave,
                    "nome": dados["nome"],
                    "estrategias": dados["estrategias"],
                })
                break

    return encontradas


def gerar_adaptacoes_inclusivas(texto_necessidades: str) -> Dict[str, Any]:
    """
    Recebe o texto do professor e retorna um bloco completo de adaptações inclusivas.
    """
    if not texto_necessidades or not texto_necessidades.strip():
        return {
            "tem_necessidades": False,
            "mensagem": "Nenhuma necessidade específica informada. A aula foi gerada no formato universal, adequado à maioria dos alunos.",
            "condicoes": [],
        }

    condicoes = detectar_necessidades(texto_necessidades)

    if not condicoes:
        return {
            "tem_necessidades": True,
            "mensagem": (
                f"O professor informou: \"{texto_necessidades}\". "
                "Não foi identificada uma condição específica catalogada, mas recomenda-se "
                "atenção individualizada e flexibilização das atividades conforme necessário."
            ),
            "condicoes": [],
            "texto_original": texto_necessidades,
        }

    return {
        "tem_necessidades": True,
        "mensagem": f"Foram identificadas {len(condicoes)} necessidade(s) específica(s). Abaixo estão as adaptações pedagógicas recomendadas.",
        "condicoes": condicoes,
        "texto_original": texto_necessidades,
    }