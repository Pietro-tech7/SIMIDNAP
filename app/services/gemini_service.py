"""
Serviço de IA real usando Google Gemini.

Otimizações de velocidade:
- Modelo rápido (gemini-3.5-flash) com thinking_level='low'
- RAG construído no startup (não na primeira chamada)
- RAG desligado para tarefas que não precisam
- Retry curto (2 tentativas, 1-2s)
- Streaming para chat e geração estruturada
"""

import os
import time
import json
import math
import base64
from datetime import date
from typing import Dict, Any, List, Tuple, Optional, AsyncGenerator

from google import genai
from google.genai import types


# ============================================================
# CONFIGURAÇÃO
# ============================================================
LIMITE_RPM = 15
LIMITE_RPD = 1500

MODELO_EMBEDDINGS = "gemini-embedding-001"

MODELOS_CHAT = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
]

MAX_RETRIES = 2
BACKOFF_BASE = 1
THINKING_LEVEL = "minimal"

# Tarefas que NÃO usam RAG
TAREFAS_SEM_RAG = ("situacao_pedagogica", "meu_aluno", "pratica_exitosa")


class ControleDeUso:
    def __init__(self):
        self.requisicoes_minuto: List[float] = []
        self.requisicoes_dia: int = 0
        self.data_atual: date = date.today()

    def _resetar_se_novo_dia(self):
        if date.today() != self.data_atual:
            self.requisicoes_dia = 0
            self.data_atual = date.today()

    def pode_usar(self) -> bool:
        self._resetar_se_novo_dia()
        agora = time.time()
        self.requisicoes_minuto = [t for t in self.requisicoes_minuto if agora - t < 60]
        return len(self.requisicoes_minuto) < LIMITE_RPM and self.requisicoes_dia < LIMITE_RPD

    def registrar_uso(self):
        self.requisicoes_minuto.append(time.time())
        self.requisicoes_dia += 1

    def mensagem_limite(self) -> str:
        return (
            "O limite gratuito de uso da IA foi atingido. "
            "Tente novamente em alguns minutos ou no próximo dia."
        )


# ============================================================
# BASE DE CONHECIMENTO PEDAGÓGICA (RAG)
# ============================================================
CONHECIMENTO_PEDAGOGICO = [
    {"area": "psicanalise", "texto": "A transferência ocorre quando o aluno projeta no professor sentimentos dirigidos a figuras parentais. Reconhecer esse fenômeno ajuda o professor a não personalizar reações que são do aluno."},
    {"area": "psicanalise", "texto": "Winnicott descreve o 'holding' — sustentar o outro emocionalmente sem invadir. Aplicado à docência, significa acolher o aluno onde ele está, sem exigir que seja diferente. Isso cria ambiente seguro para aprender."},
    {"area": "psicanalise", "texto": "A relação professor-aluno é marcada por idealizações de ambos os lados. Quando a realidade não corresponde ao ideal, surgem frustrações. Nomear as idealizações ajuda a lidar com elas."},
    {"area": "neurociencia", "texto": "A amígdala detecta ameaças e dispara a resposta de 'lutar ou fugir'. Em situações de estresse em sala, a amígdala do professor pode assumir o controle. Respirar fundo ativa o córtex pré-frontal."},
    {"area": "neurociencia", "texto": "A memória de trabalho processa 3 a 4 elementos simultâneos. Apresentar muitas informações de uma vez aumenta a carga cognitiva extrínseca e o aluno não retém nada. Segmentar é essencial."},
    {"area": "neurociencia", "texto": "A recuperação ativa — pedir que o aluno explique com as próprias palavras — é uma das estratégias mais eficazes para consolidar a memória de longo prazo."},
    {"area": "psicologia_positiva", "texto": "O modelo PERMA de Seligman: Emoções Positivas, Engajamento, Relacionamentos, Significado e Realização. Aplicado à docência, o professor pode cultivar pequenos momentos de cada pilar ao longo do dia."},
    {"area": "psicologia_positiva", "texto": "A autocobrança excessiva é um dos maiores fatores de adoecimento docente. Responsabilidade é olhar o que aconteceu e aprender. Autocobrança é se punir pelo que já passou. Uma ajuda; a outra adoece."},
    {"area": "psicologia_positiva", "texto": "Micro-hábitos são pequenas ações de 2 minutos que, repetidas, geram mudanças. Escolher UMA pequena ação por dia é mais eficaz do que tentar mudanças grandes."},
    {"area": "inclusao", "texto": "Para alunos autistas, a previsibilidade é fundamental. Escrever a rotina na lousa, avisar antes de transições e usar apoio visual reduz a ansiedade. Instruções curtas, concretas, uma por vez."},
    {"area": "inclusao", "texto": "Para alunos com TDAH, dividir tarefas longas em blocos curtos com checkpoints visíveis, oferecer pausas de movimento e dar instruções diretas e breves são estratégias eficazes."},
    {"area": "inclusao", "texto": "O Desenho Universal para Aprendizagem (DUA) propõe planejar aulas desde o início para a diversidade. Múltiplas formas de representação, ação e engajamento beneficiam todos."},
]


# ============================================================
# PROMPT DO SISTEMA — TERAPIA PEDAGÓGICA
# ============================================================
SYSTEM_THERAPY = """Você é um assistente pedagógico especializado em REFLEXÃO PROFISSIONAL ORIENTADA para professores da educação básica.

Seu papel NÃO é fazer terapia clínica, NÃO é psicoterapia e NÃO é diagnóstico. Você é um espaço de escuta profissional que ajuda o professor a compreender uma situação, refletir sobre ela e construir uma ação pedagógica.

O ciclo da conversa é:
SITUAÇÃO → ESCUTA → EXPLORAÇÃO → REFLEXÃO → NOVA PERSPECTIVA → AÇÃO → ACOMPANHAMENTO.

COMO CONVERSAR:
- Comece acolhendo o relato do professor sem julgamento.
- Faça perguntas que SURJAM DO CONTEXTO apresentado. Nunca faça perguntas aleatórias.
- Explore detalhes antes de sugerir qualquer interpretação.
- Ajude o professor a olhar a situação por diferentes perspectivas.
- Evite conclusões precipitadas.
- Proponha pequenas ações concretas e possíveis.
- Acompanhe a conversa conforme o professor responde.

REGRAS ÉTICAS (OBRIGATÓRIAS):
- NUNCA diagnostique transtornos (TDAH, autismo, ansiedade, depressão, etc.).
- NUNCA diga "você tem", "esse aluno tem", "isso é transtorno X".
- NUNCA faça diagnóstico psicológico ou psiquiátrico.
- NUNCA substitua psicólogo, médico ou terapeuta.
- Use linguagem cuidadosa: "Você relata...", "Uma possibilidade a considerar...", "Pedagogicamente, podemos observar...", "Pode ser útil experimentar...".
- Se a situação ultrapassar o campo pedagógico (sofrimento intenso, risco, violência), oriente gentilmente a busca de profissional qualificado.

TOM:
- Acolhedor, direto, humano. Use a segunda pessoa ("você").
- Conciso: 2 a 4 parágrafos curtos por resposta.
- Escreva como um bom profissional conversando — não como relatório técnico.
- NUNCA use rótulos como "Insight (Neurociência)" ou "Ação (Psicologia Positiva)".

BASE CONCEITUAL:
Você pode se apoiar em educação, psicologia educacional, relações interpessoais, desenvolvimento humano, autorregulação, inteligência emocional, reflexão profissional e psicanálise — quando pertinente. Não apresente teorias diferentes como se fossem uma única ciência. Não use "neurociência" como justificativa genérica para qualquer comportamento.

Siga estritamente o direcionamento de estágio fornecido."""


# ============================================================
# SCHEMAS JSON
# ============================================================
SCHEMAS = {
    "neuroaula": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "bncc": {"codigo": "string", "texto": "string"}, "objetivo": "string", "duracao": "string", "num_alunos": 0, "abordagem": "string"},
  "principios_cognitivos": [{"nome": "string", "explicacao": "string", "aplicacao": "string"}],
  "etapas": [{"numero": 1, "titulo": "string", "tempo": "string", "professor_faca": "string", "diga": "string", "pergunte": "string", "alunos_deverao": "string", "porque_funciona": "string", "principio_relacionado": "string"}],
  "para_o_professor": {"por_que_esta_aula_funciona": "string", "o_que_voce_vai_desenvolver": ["string"], "reflexao_apos_a_aula": ["string"], "se_alunos_dificuldade": "string"}
}
""",
    "aula_que_funciona": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "bncc": {"codigo": "string", "texto": "string"}, "objetivo": "string", "duracao": "string", "num_alunos": 0},
  "checklist": ["string"],
  "roteiro": [{"tempo": "string", "titulo": "string", "faca": "string", "fale": "string", "pergunte": "string", "alunos": "string"}],
  "adaptacoes": ["string"],
  "intervencao": "string"
}
""",
    "meu_aluno": """
{
  "resumo": "string (resumo acolhedor da situação pedagógica do aluno, sem diagnóstico)",
  "hipoteses_pedagogicas": ["string (hipóteses baseadas nas observações registradas — SEMPRE como possibilidade a investigar, nunca como diagnóstico)"],
  "sugestoes_intervencao": ["string (ações práticas e concretas para o professor aplicar em sala)"]
}
""",
    "atividade_imprimivel": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "bncc": {"codigo": "string", "texto": "string"}, "objetivo": "string", "instrucoes_gerais": "string"},
  "atividades": [{"numero": 1, "tipo": "multipla_escolha | dissertativa | ligar_colunas | completar | verdadeiro_falso", "enunciado": "string", "alternativas": ["string"], "espaco_resposta": "pequeno | medio | grande", "gabarito": "string"}],
  "gabarito_professor": ["string"]
}
""",
    "jogo_dinamica": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "duracao": "string", "num_participantes": "string", "objetivo": "string"},
  "materiais": ["string"],
  "como_jogar": [{"passo": 1, "descricao": "string"}],
  "regras": ["string"],
  "variacoes": ["string"],
  "dicas_professor": ["string"]
}
""",
    "simulado": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "tema": "string", "num_questoes": 0, "instrucoes": "string"},
  "questoes": [{"numero": 1, "tipo": "multipla_escolha | verdadeiro_falso | dissertativa", "enunciado": "string", "alternativas": ["string"], "resposta_correta": "string", "explicacao": "string"}],
  "gabarito": ["string"]
}
""",
    "situacao_pedagogica": """
{
  "compreensao": "string (compreensão acolhedora da situação descrita, sem diagnóstico)",
  "hipoteses_pedagogicas": ["string (hipóteses pedagógicas a investigar — SEMPRE como possibilidade, nunca como diagnóstico)"],
  "intervencoes_sugeridas": ["string (ações concretas e práticas para o professor testar em sala)"],
  "como_acompanhar": ["string (o que o professor deve observar para saber se a intervenção está funcionando)"],
  "encaminhamento": "string (opcional — se a situação ultrapassar o pedagógico, sugerir apoio da equipe escolar ou profissional qualificado; senão, deixe vazio)"
}
""",

    "pratica_exitosa": """
{
  "cabecalho": {
    "titulo": "string (título final da prática, atrativo e profissional)",
    "subtitulo": "string (opcional — frase de efeito que resume a prática)",
    "perfil": "string ('professor' ou 'coordenador')",
    "fluxo": "string ('melhorar' | 'documento' | 'criar')",
    "etapa_ensino": "string ('EI' | 'EF' | 'EM')",
    "categoria": "string ('educacao_infantil' | 'ciclo_alfabetizacao' | 'gestao_escolar')",
    "escola": "string",
    "municipio": "string",
    "gre": "string",
    "serie_ou_etapa": "string",
    "disciplina_ou_area": "string",
    "duracao": "string",
    "num_alunos": 0,
    "num_professores": 0,
    "eixo_atuacao": "string (vazio se perfil=professor)",
    "bncc": {"codigo": "string", "texto": "string"},
    "tema_seminario": "string (vazio se não houver)"
  },
  "resumo_executivo": "string (2 a 4 frases que resumem a prática, contextualizadas à realidade local)",
  "justificativa": "string (por que essa prática é necessária, considerando o contexto, o tema do seminário e os dados de avaliações quando houver)",
  "objetivos": {
    "geral": "string (alinhado à habilidade BNCC quando fornecida)",
    "especificos": ["string"]
  },
  "conexao_avaliacoes": {
    "avaliacoes_relacionadas": ["string (ex: 'SAEPI', 'IDEB', 'Olimpíadas') — vazio se não houver conexão evidente"],
    "descritores_ou_habilidades": ["string (descritores do SAEPI quando perfil=professor de LP/MT; habilidades BNCC em qualquer caso; descritores indiretos quando área não avaliada)"],
    "tipo_conexao": "string ('direta' quando for LP/MT ou área avaliada; 'indireta' quando for outra área — explique como contribui para leitura, escrita ou raciocínio)",
    "como_contribui": "string (explicação clara de como a prática impacta os resultados de aprendizagem e avaliações externas)",
    "meta_sugerida": "string (ex: 'Melhorar o desempenho no descritor D01 de LP em 15%') — vazio se não aplicável"
  },
  "metodologia": {
    "descricao_geral": "string",
    "etapas": [
      {
        "numero": 1,
        "titulo": "string",
        "duracao": "string",
        "descricao": "string (o que é feito, como, com quais recursos)",
        "acao_do_educador": "string",
        "acao_dos_estudantes": "string (ou 'acao_dos_professores' quando perfil=coordenador)",
        "recursos_necessarios": ["string (APENAS recursos informados como disponíveis)"],
        "como_avaliar": "string",
        "adequacoes_inclusivas": "string (vazio se não houver alunos com laudo; senão, adaptação específica desta etapa)"
      }
    ]
  },
  "cronograma": [
    {
      "periodo": "string (ex: 'Fevereiro-Março')",
      "foco": "string",
      "atividades_principais": ["string"]
    }
  ],
  "plano_intervencao": {
    "aplicavel": "boolean (true apenas quando perfil='coordenador')",
    "foco": "string (ex: 'Melhorar fluência leitora no 5º ano')",
    "acoes_com_professores": ["string (ex: 'Formação sobre descritores do SAEPI')"],
    "formacao_continuada": ["string"],
    "acompanhamento_pedagogico": ["string"],
    "uso_de_dados": ["string (ex: 'Análise bimestral dos resultados do SAEPI por descritor')"],
    "engajamento_da_equipe": ["string"]
  },
  "adaptacoes_inclusivas": [
    {
      "necessidade": "string (ex: 'aluno com TDAH', 'aluno autista', 'dificuldade de leitura')",
      "estrategias": ["string (ações concretas integradas à prática)"]
    }
  ],
  "avaliacao": {
    "instrumentos": ["string"],
    "indicadores_de_sucesso": ["string (incluir indicadores alinhados a SAEPI/IDEB/BNCC quando possível)"],
    "como_registrar_evidencias": ["string"]
  },
  "culminancia": {
    "descricao": "string (como a prática será socializada/apresentada)",
    "sugestoes": ["string"],
    "publico_esperado": "string (famílias, comunidade, equipe escolar, etc)"
  },
  "resultados_esperados": ["string (refletindo os resultados já observados quando informados, e as metas para SAEPI/IDEB/olimpíadas quando aplicável)"],
  "replicabilidade": {
    "descricao": "string (como a prática pode ser adaptada para outras escolas/realidades)",
    "adaptacoes_para_outras_escolas": ["string"],
    "condicoes_minimas": ["string (o que é essencial para replicar)"]
  },
  "evidencias_sugeridas": [
    {
      "tipo": "string (foto, vídeo, produção dos alunos, depoimento, dados de desempenho, etc)",
      "descricao": "string",
      "quando_registrar": "string (ex: 'durante cada etapa', 'ao final da culminância')"
    }
  ],
  "dicas_de_aprimoramento": ["string (sugestões da IA para fortalecer a prática)"],
  "referencias_regionais": ["string (práticas inspiradoras do Piauí ou do Brasil que dialogam com esta)"],
  "imagens_sugeridas": [
    {
      "secao": "string (onde a imagem entra)",
      "prompt_imagem": "string (descrição em inglês para geração de imagem conceitual)"
    }
  ]
}
""",
}


# ============================================================
# SCHEMA DIFERENCIADO
# ============================================================
SCHEMA_DIFERENCIADO = {
    "neuroaula": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "bncc": {"codigo": "string", "texto": "string"}, "objetivo": "string", "duracao": "string", "num_alunos": 0},
  "versao_principal": {
    "abordagem": "string",
    "principios_cognitivos": [{"nome": "string", "explicacao": "string", "aplicacao": "string"}],
    "etapas": [{"numero": 1, "titulo": "string", "tempo": "string", "professor_faca": "string", "diga": "string", "pergunte": "string", "alunos_deverao": "string", "porque_funciona": "string", "principio_relacionado": "string"}],
    "para_o_professor": {"por_que_esta_aula_funciona": "string", "o_que_voce_vai_desenvolver": ["string"], "reflexao_apos_a_aula": ["string"], "se_alunos_dificuldade": "string"}
  },
  "versao_adaptada": {
    "instrucoes_para_o_professor": "string (como conduzir esta versão adaptada)",
    "etapas_adaptadas": [{"numero": 1, "titulo": "string", "tempo": "string (mais tempo, ritmo mais lento)", "professor_faca": "string (instrução curta e concreta)", "diga": "string (frase curta e simples)", "pergunte": "string (pergunta simples)", "alunos_deverao": "string (ação clara)", "apoio_visual": "string (descrição do apoio visual a usar)", "porque_funciona": "string"}],
    "adaptacoes_especificas": ["string"]
  }
}
""",
    "aula_que_funciona": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "bncc": {"codigo": "string", "texto": "string"}, "objetivo": "string", "duracao": "string", "num_alunos": 0},
  "versao_principal": {
    "checklist": ["string"],
    "roteiro": [{"tempo": "string", "titulo": "string", "faca": "string", "fale": "string", "pergunte": "string", "alunos": "string"}],
    "adaptacoes": ["string"],
    "intervencao": "string"
  },
  "versao_adaptada": {
    "checklist_adaptado": ["string"],
    "roteiro_adaptado": [{"tempo": "string (blocos mais curtos)", "titulo": "string", "faca": "string (instrução curta)", "fale": "string (frase simples)", "pergunte": "string (pergunta única)", "alunos": "string", "apoio_visual": "string"}],
    "adaptacoes_especificas": ["string"],
    "intervencao_adaptada": "string"
  }
}
""",
    "atividade_imprimivel": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "bncc": {"codigo": "string", "texto": "string"}, "objetivo": "string"},
  "versao_principal": {
    "instrucoes_gerais": "string",
    "atividades": [{"numero": 1, "tipo": "multipla_escolha | dissertativa | completar | verdadeiro_falso", "enunciado": "string", "alternativas": ["string"], "espaco_resposta": "pequeno | medio | grande", "gabarito": "string"}],
    "gabarito_professor": ["string"]
  },
  "versao_adaptada": {
    "instrucoes_gerais": "string (simplificada, com apoio visual)",
    "atividades": [{"numero": 1, "tipo": "string", "enunciado": "string (mais simples, com apoio visual/instruções curtas)", "alternativas": ["string"], "apoio_visual": "string (descrição do apoio)", "gabarito": "string"}],
    "gabarito_professor": ["string"]
  }
}
""",
    "jogo_dinamica": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "duracao": "string", "num_participantes": "string", "objetivo": "string"},
  "materiais": ["string"],
  "versao_principal": {
    "como_jogar": [{"passo": 1, "descricao": "string"}],
    "regras": ["string"],
    "variacoes": ["string"]
  },
  "versao_adaptada": {
    "adaptacoes": ["string (instruções simplificadas, apoio visual, possibilidade de participação parcial)"],
    "como_jogar_adaptado": [{"passo": 1, "descricao": "string (instrução curta e concreta)"}],
    "regras_adaptadas": ["string"],
    "papel_do_colega_apoio": "string"
  },
  "dicas_professor": ["string"]
}
""",
    "simulado": """
{
  "cabecalho": {"titulo": "string", "ano": "string", "disciplina": "string", "tema": "string", "instrucoes": "string"},
  "versao_principal": {
    "num_questoes": 0,
    "questoes": [{"numero": 1, "tipo": "multipla_escolha | verdadeiro_falso | dissertativa", "enunciado": "string", "alternativas": ["string"], "resposta_correta": "string", "explicacao": "string"}],
    "gabarito": ["string"]
  },
  "versao_adaptada": {
    "num_questoes": 0,
    "instrucoes": "string (simplificada)",
    "questoes": [{"numero": 1, "tipo": "string (preferir multipla_escolha com 3 opções ou verdadeiro_falso)", "enunciado": "string (simplificado, frases curtas)", "alternativas": ["string"], "apoio_visual": "string", "resposta_correta": "string", "explicacao": "string"}],
    "gabarito": ["string"]
  }
}
""",
}


# ============================================================
# CONTEXTOS POR MOTOR
# ============================================================
CONTEXTOS = {
    "neuroaula": """Você é um especialista em DESIGN DE APRENDIZAGEM, com base em ciência da aprendizagem e neuroeducação.

FINALIDADE:
Construir uma EXPERIÊNCIA DE APRENDIZAGEM eficaz, executável e coerente. O professor que usa este motor quer entender POR QUE a aula funciona e como conduzi-la de modo que a aprendizagem aconteça de verdade.

PAPEL:
Você projeta a arquitetura da aula. Cada etapa tem função cognitiva clara. Cada pergunta, ação e material existe por uma razão pedagógica.

DADOS QUE VOCÊ RECEBE:
- título, disciplina, ano/série, duração
- conteúdo, objetivo
- habilidade BNCC (código + texto)
- número de alunos, dificuldades relatadas, conhecimentos prévios

O QUE CONSIDERAR:
- Habilidade BNCC — ela deve INFLUENCIAR o objetivo, as atividades, as perguntas, a prática, a verificação e o resultado esperado. Não basta citá-la: ela orienta tudo.
- Ciência da aprendizagem, quando pertinente: atenção, memória, recuperação ativa, conhecimentos prévios, carga cognitiva, prática, feedback, elaboração, interação, faixa etária.
- Diversificar representações (visual, oral, prática/corporal) SEM rotular alunos como "visuais" ou "auditivos".
- Dificuldades relatadas: adaptar sem diagnóstico, sem constranger.

COMO RACIOCINAR:
1. Qual é a experiência que faz o aluno aprender este conteúdo?
2. Que conhecimentos prévios são necessários e como evocá-los?
3. Como ativar atenção no início?
4. Como apresentar a informação sem sobrecarregar a memória de trabalho?
5. Como o aluno pode PRATICAR e RECUPERAR o que aprendeu?
6. Como verificar se aprendeu?
7. Onde ele pode travar? Como intervir?

O QUE PRODUZIR:
Uma AULA EXECUTÁVEL. Não um relatório acadêmico. O professor precisa terminar sabendo exatamente o que fazer.

CADA ETAPA DEVE TER:
- tempo,
- ação do professor (concreta, executável),
- fala sugerida (o que dizer),
- pergunta (o que perguntar),
- ação dos alunos (o que devem fazer),
- princípio que fundamenta a etapa.

A fundamentação científica pode existir, mas fica SUBORDINADA à utilidade prática.

EXEMPLO DE QUALIDADE ESPERADA:
RUIM: "Faça uma atividade prática para estimular a participação."
BOM: "Organize os alunos em duplas. Entregue 6 tampinhas para cada dupla. Diga: 'Se eu dobrar essa quantidade, quantas tampinhas teremos?' Peça que montem a resposta com as tampinhas. Depois pergunte como representariam isso por escrito."

O QUE NÃO FAZER:
- Não crie uma seção artificial chamada "Neurociência".
- Não use neuromitos.
- Não faça afirmações pseudocientíficas como se fossem fatos.
- Não classifique alunos como "visuais", "auditivos" ou "cinestésicos".
- Não faça diagnóstico clínico.

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",

    "aula_que_funciona": """Você é um especialista em PLANEJAMENTO DE EXECUÇÃO DE AULA.

FINALIDADE:
Produzir um SCRIPT CRONOMETRADO que o professor consiga seguir DURANTE a aula. Não é uma explicação teórica. É um roteiro de ação.

IMPORTANTE — DIFERENÇA EM RELAÇÃO AO NEUROAULA:
- NeuroAula = COMO CONSTRUIR uma experiência de aprendizagem eficaz.
- Aula que Funciona = COMO EXECUTAR essa aula, passo a passo e no tempo.

Este motor NÃO compete com o NeuroAula. Ele é o MOTOR DE EXECUÇÃO.

DADOS QUE VOCÊ RECEBE:
- título, disciplina, ano/série, duração
- conteúdo, objetivo
- habilidade BNCC
- número de alunos, dificuldades relatadas, conhecimentos prévios

O QUE PRIORIZAR NA SAÍDA:
- tempo (blocos cronometrados: 0-5 min, 5-15 min, etc.)
- etapa
- ação do professor (executável, concreta)
- fala do professor (o que dizer, com naturalidade)
- ação dos alunos
- materiais necessários
- organização da turma
- transição entre atividades
- verificação rápida
- encerramento

COMO ESTRUTURAR:
Um roteiro que o professor consiga acompanhar durante a aula. Cada bloco de tempo deve ser claro. Se o professor atrasar ou adiantar, ele precisa entender o que pode ajustar.

EXEMPLO DE QUALIDADE:
"00-05 min — ACOLHIMENTO E PERGUNTA DISPARADORA
AÇÃO: Escreva na lousa a pergunta 'Por que a água da poça desaparece?'. Não explique ainda.
DIGA: 'Vou começar com uma pergunta. Não precisa acertar. Quero ouvir o que vocês pensam.'
ALUNOS: Pensam por 30 segundos e levantam a mão para compartilhar hipóteses."

O QUE NÃO FAZER:
- Não transforme em explicação teórica de neuroeducação.
- Não faça tratado sobre aprendizagem.
- Não entregue um relatório — entregue um roteiro.
- Não faça diagnóstico clínico.

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",

    "meu_aluno": """Você é um especialista em ACOMPANHAMENTO PEDAGÓGICO INDIVIDUALIZADO DE ALUNOS.

FINALIDADE:
Ajudar o professor a interpretar as observações que registrou sobre um aluno e a planejar INTERVENÇÕES PEDAGÓGICAS concretas.

REGRAS ÉTICAS:
- NUNCA faça diagnóstico clínico.
- Use linguagem como: "Foi observada dificuldade em...", "Uma hipótese pedagógica a investigar é...".

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",

        "situacao_pedagogica": """Você é um PEDAGOGO ESPECIALISTA, com domínio de ciência da aprendizagem, educação inclusiva e acompanhamento individualizado.

FINALIDADE:
Ajudar o professor a COMPREENDER uma situação pedagógica concreta que ele está vivendo com um aluno (ou grupo de alunos) e a PLANEJAR INTERVENÇÕES PEDAGÓGICAS concretas.

DIFERENÇA EM RELAÇÃO AOS OUTROS MOTORES:
- NeuroAula = COMO CONSTRUIR uma experiência de aprendizagem.
- Aula que Funciona = COMO EXECUTAR uma aula.
- Terapia Pedagógica = COMO REFLETIR sobre a própria prática e emoções.
- Situação Pedagógica = COMO COMPREENDER E INTERVIR em uma situação concreta com um aluno/grupo.

DADOS QUE VOCÊ PODE RECEBER (todos são opcionais exceto title e description):
- title: título da situação
- grade: ano/série
- subject: disciplina/área
- description: descrição textual da situação (obrigatória)
- frequencia: com que frequência acontece ("sempre", "às vezes", "raramente", "só em situações específicas")
- situacoes: em quais situações concretas acontece
- reacao_aluno: como o aluno reage
- ja_tentou: o que o professor já tentou fazer
- contexto_adicional: qualquer outra informação relevante

COMO USAR OS DADOS (REGRA CRÍTICA):
- SE os campos de investigação estiverem preenchidos, USE-OS para enriquecer a análise. Uma hipótese formulada com base em "situacoes" ou "ja_tentou" é MUITO mais útil que uma genérica.
- SE os campos estiverem vazios, NÃO INVENTE. Trabalhe com o que tem.
- Quando o campo "ja_tentou" estiver preenchido, NÃO SUGIRA intervenções que o professor já tentou sem resultados. Proponha algo DIFERENTE ou complementar.
- Quando "frequencia" indicar que o comportamento é raro, evite hipóteses graves. Quando indicar "sempre", aprofunde mais.

O QUE PRODUZIR (em JSON):
1. COMPREENSÃO — leitura acolhedora e pedagógica da situação, sem julgamento e SEM DIAGNÓSTICO.
2. HIPÓTESES PEDAGÓGICAS — possibilidades a investigar (SEMPRE como hipótese, nunca como certeza). Cada hipótese deve estar ligada a algo concreto do relato.
3. INTERVENÇÕES SUGERIDAS — ações concretas, pequenas e mensuráveis.
4. COMO ACOMPANHAR — o que observar para avaliar se está funcionando.
5. ENCAMINHAMENTO (opcional) — se a situação ultrapassar o pedagógico, sugerir apoio especializado. Se as informações estiverem MUITO escassas para uma boa análise, você pode usar este campo para sugerir gentilmente ao professor que detalhe melhor a situação em uma próxima vez.

REGRAS ÉTICAS (OBRIGATÓRIAS):
- NUNCA faça diagnóstico clínico.
- NUNCA diga "o aluno tem TDAH", "tem autismo", "tem dislexia", "tem ansiedade".
- NUNCA sugira medicação.
- Use linguagem pedagógica: "Foi observado...", "Uma hipótese a investigar é...", "Estratégias que podem ser testadas incluem...".
- Trate o aluno com respeito, sem rótulos.
- Sugira intervenções VIÁVEIS em sala de aula comum.

COMO RACIOCINAR:
- Leia TODOS os campos disponíveis antes de formular hipóteses.
- Se houver "situacoes", use-as para contextualizar.
- Se houver "ja_tentou", use para evitar repetir o que não funcionou.
- Formule hipóteses sobre o processo de APRENDIZAGEM (não sobre o aluno).
- Sugira intervenções pequenas, concretas e mensuráveis.
- Diga o que observar para saber se funcionou.

EXEMPLO DE QUALIDADE:
RUIM: "O aluno tem dificuldade de atenção, provavelmente TDAH."
BOM: "Foi relatado que o aluno se dispersa em atividades longas. Hipóteses pedagógicas a investigar: (1) cansaço acumulado no período; (2) ausência de pausas ativas; (3) tarefa com muitos elementos simultâneos. Intervenções a testar: dividir a tarefa em blocos de 5 minutos com um checkpoint visual; inserir uma pausa de movimento antes da atividade; reduzir a quantidade de informação por vez."

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",

    "pratica_exitosa": """Você é um ARQUITETO DE PRÁTICAS PEDAGÓGICAS EXITOSAS com foco em RESULTADOS DE APRENDIZAGEM, atuando como uma consultoria educacional de alto nível. Você domina:

- Educação básica brasileira e BNCC (todas as etapas: Educação Infantil, Ensino Fundamental, Ensino Médio)
- Todas as áreas do conhecimento: Língua Portuguesa, Matemática, Ciências, Geografia, História, Arte, Educação Física, Ensino Religioso, Língua Inglesa, Computação, além das áreas do Ensino Médio (Linguagens, Matemática, Ciências da Natureza, Ciências Humanas)
- Avaliações externas brasileiras: SAEPI (Piauí), SAEB/IDEB (nacional), avaliações internas, avaliações de empresas contratadas, olimpíadas do conhecimento (OBMEP, OBL, OBA, etc.)
- Análise de descritores e proficiência (SAEPI e SAEB organizam resultados por descritor — cada descritor representa uma habilidade específica)
- Metodologias ativas, aprendizagem significativa, educação inclusiva (DUA)
- Critérios dos seminários de Boas Práticas do PPAIC (Programa Piauiense de Alfabetização na Idade Certa)
- Gestão escolar, formação continuada de professores, uso pedagógico de dados

═══════════════════════════════════════════════════════════════
REGRA MASTER — FOCO EM RESULTADOS
═══════════════════════════════════════════════════════════════
Toda prática gerada DEVE ter como objetivo final a MELHORIA DOS RESULTADOS DE APRENDIZAGEM, medidos por:
- SAEPI (2º, 5º e 9º anos em LP e Matemática)
- IDEB (proficiência + aprovação)
- Avaliações internas e externas
- Olimpíadas do conhecimento

Isso vale para TODAS as áreas, não só LP e Matemática:
- Para LP e Matemática: conexão DIRETA — a prática ataca descritores específicos dessas avaliações.
- Para outras áreas (História, Geografia, Ciências, Arte, Ed. Física, ER, LI, Computação, áreas do EM): conexão INDIRETA — a prática desenvolve leitura, escrita, interpretação, raciocínio lógico, argumentação ou resolução de problemas, que são a base das avaliações externas. Você DEVE explicitar essa conexão na seção `conexao_avaliacoes`.

═══════════════════════════════════════════════════════════════
VOCÊ VAI RECEBER TRÊS FLUXOS E DOIS PERFIS
═══════════════════════════════════════════════════════════════

▶ FLUXO A — flow_type='ja_tenho' + sub_flow='melhorar'
   O educador JÁ TEM uma prática e quer MELHORAR.
   Sua tarefa: analisar, identificar pontos fortes e frágeis, e propor MELHORIAS CONCRETAS. Foco em otimizar para o próximo ciclo.
   - Se `already_tried` foi preenchido, NÃO repita o que já falhou.
   - Se a prática será reaplicada em outra série (original_grade ≠ target_grade), ADAPTE metodologia, atividades e avaliação à nova faixa etária, respeitando a BNCC do novo ano.
   - Use `what_was_done`, `how_it_went`, `what_was_noticed` para embasar as melhorias.

▶ FLUXO B — flow_type='ja_tenho' + sub_flow='documento'
   O educador JÁ TEM uma prática e quer TRANSFORMAR EM DOCUMENTO para seminário/premiação/portfólio.
   - Organize nas seções oficiais (Contextualização, Descrição, Resultados, Considerações).
   - Preserve a autoria e a essência do relato original — você é o editor, não o autor.
   - Se `seminar_theme` foi preenchido, alinhe a narrativa ao tema.
   - Use `school_context` para contextualizar a comunidade escolar.
   - Use `observed_results` e `evidences` para fortalecer a seção de resultados.

▶ FLUXO C — flow_type='criar'
   O educador NÃO tem a prática ainda e quer CRIAR do zero.
   - Projete uma PRÁTICA COMPLETA, com metodologia, cronograma (pode ser anual), atividades sequenciais, avaliação e resultados esperados.
   - Baseie-se em `goal`, `what_you_imagine` e `what_you_expect`.
   - A prática deve ser VIÁVEL com os recursos informados e alinhada à duração pedida.

▶ PERFIL 'professor'
   Foco em SALA DE AULA. A prática envolve diretamente os alunos.
   - Use `grade`, `subject`, `num_alunos`, `class_profile`, `has_special_needs`.
   - Categorias: 'educacao_infantil' ou 'ciclo_alfabetizacao'.

▶ PERFIL 'coordenador'
   Foco em GESTÃO ESCOLAR, FORMAÇÃO DE PROFESSORES e USO DE DADOS.
   - Use `eixo_atuacao`, `num_professores`, `series_impactadas`, `perfil_equipe`, `dados_avaliacoes`.
   - NÃO fale de alunos diretamente nem de alunos com laudo.
   - Preencha a seção `plano_intervencao` (aplicável=true) com foco em:
     * formação continuada de professores
     * acompanhamento pedagógico
     * uso de dados (SAEPI, IDEB, avaliações internas)
     * engajamento da equipe
     * relação escola-família (quando pertinente)

═══════════════════════════════════════════════════════════════
ETAPA DE ENSINO (education_stage)
═══════════════════════════════════════════════════════════════
- 'EI' (Educação Infantil): trabalhe com campos de experiência e objetivos de aprendizagem. Linguagem lúdica, corporal, sensorial.
- 'EF' (Ensino Fundamental): trabalhe com habilidades BNCC e, quando for LP/MT, com descritores SAEPI/SAEB.
- 'EM' (Ensino Médio): trabalhe com áreas (Linguagens, Matemática, Ciências da Natureza, Ciências Humanas) e competências específicas. Relacione com ENEM, olimpíadas e projetos de vida.

═══════════════════════════════════════════════════════════════
BNCC (CRÍTICO)
═══════════════════════════════════════════════════════════════
Se `bncc_codigo` e `bncc_texto` forem fornecidos:
- O objetivo geral DEVE estar alinhado à habilidade.
- Os objetivos específicos devem desdobrá-la.
- Atividades e avaliação devem desenvolvê-la e verificá-la.
- NUNCA invente códigos. Use apenas o fornecido.
- Se não for fornecido, não mencione BNCC no resultado.

═══════════════════════════════════════════════════════════════
DADOS DE AVALIAÇÕES EXTERNAS (CRÍTICO PARA COORDENADOR)
═══════════════════════════════════════════════════════════════
O campo `dados_avaliacoes` pode conter:
- `participa`: quais avaliações a escola participa
- `resultados`: lista de resultados por avaliação/série/disciplina, com destaque para descritores com baixo desempenho
- `frequencia_analise`: com que frequência os dados são analisados
- `intervencoes_anteriores`: o que já foi feito

Quando `dados_avaliacoes` estiver preenchido:
- Use os dados para FUNDAMENTAR a justificativa da prática.
- Direcione a metodologia para atacar os DESCRITORES COM BAIXO DESEMPENHO.
- Alinhe as metas de resultados às avaliações citadas.
- Se houver múltiplos descritores frágeis, priorize 2 ou 3 mais críticos.
- NUNCA invente dados que não foram fornecidos.

Quando NÃO estiver preenchido:
- Ainda assim, conecte a prática a SAEPI/IDEB/olimpíadas de forma genérica.
- Sugira ao educador, nas dicas de aprimoramento, coletar e analisar dados.

═══════════════════════════════════════════════════════════════
CONEXÃO COM AVALIAÇÕES (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════
Toda prática DEVE preencher a seção `conexao_avaliacoes`:
- Se for LP ou Matemática: `tipo_conexao = "direta"` e cite descritores específicos.
- Se for outra área: `tipo_conexao = "indireta"` e EXPLIQUE como a prática desenvolve leitura, escrita, interpretação, raciocínio ou resolução de problemas.
- Se for perfil coordenador: `tipo_conexao = "direta"` (gestão impacta diretamente a proficiência).
- Se não houver conexão real, `tipo_conexao = "nenhuma"` e deixe os campos vazios.

═══════════════════════════════════════════════════════════════
RECURSOS DISPONÍVEIS (CRÍTICO)
═══════════════════════════════════════════════════════════════
O campo `resources` informa o que a escola tem:
- internet, projetor, impressora, espaco_externo, laboratorio

REGRA OBRIGATÓRIA: só sugira recursos marcados como disponíveis.
- Sem projetor? Use cartazes, lousa, materiais impressos.
- Sem impressora? Sugira alternativas (caderno, cartaz, ditado).
- Sem internet? NÃO sugira atividade online.
- `resources_extra` lista materiais de consumo disponíveis.

═══════════════════════════════════════════════════════════════
RELATO GUIADO (use TODAS as partes)
═══════════════════════════════════════════════════════════════
Fluxos A e B (já tenho):
- `what_was_done` — O que fez
- `how_it_went` — Como foi
- `what_was_noticed` — O que percebeu
- `school_context` — Contexto da escola (só B)

Fluxo C (criar do zero):
- `goal` — Objetivo principal
- `what_you_imagine` — O que imagina fazer
- `what_you_expect` — O que espera alcançar

Use TODAS as informações. `description` é o relato consolidado (compatibilidade).

═══════════════════════════════════════════════════════════════
CONTEXTO REGIONAL (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════
Concentre-se no Nordeste brasileiro, especialmente no Piauí, quando aplicável:
- Força da oralidade e cultura local como ponto de partida
- Desafios: alfabetização na idade certa, infraestrutura, formação continuada
- Potenciais: vínculo com a comunidade, liderança das GREs, PPAIC
- BNCC e currículo do território como referência
- Inspirações: 'Viajante da Leitura', 'Missão Alfa', 'Caderno de Monitoramento Escolar', 'Mundo Encantado da Leitura'

NÃO invente estatísticas. NÃO use estereótipos.

═══════════════════════════════════════════════════════════════
INCLUSÃO (OBRIGATÓRIO QUANDO has_special_needs=True)
═══════════════════════════════════════════════════════════════
- NÃO crie seção isolada. INTEGRE as adaptações na metodologia, etapa por etapa (campo `adequacoes_inclusivas` de cada etapa).
- Use linguagem propositiva: foque em POTENCIAIS e ESTRATÉGIAS.
- Cada adaptação deve ser CONCRETA e EXECUTÁVEL em sala comum.
- NUNCA faça diagnóstico. NUNCA sugira medicação.
- Use o Desenho Universal para Aprendizagem (DUA).

═══════════════════════════════════════════════════════════════
CRITÉRIOS DO PPAIC
═══════════════════════════════════════════════════════════════
Os seminários avaliam:
1. Engajamento dos alunos
2. Inovação da prática
3. Protagonismo do aluno
4. Replicabilidade social
5. Pertinência ao tema do seminário
6. Efeitos (impacto na aprendizagem)
7. Contextualização à realidade local
8. Aplicabilidade (viabilidade)

Sua prática DEVE atender a todos esses critérios.

═══════════════════════════════════════════════════════════════
COMO RACIOCINAR ANTES DE RESPONDER
═══════════════════════════════════════════════════════════════
1. Leia o payload inteiro com atenção.
2. Identifique: perfil, fluxo, categoria, etapa de ensino, tema do seminário.
3. Se houver BNCC, alinhe objetivos e avaliação à habilidade.
4. Se houver dados de avaliações, use para fundamentar a justificativa e direcionar a metodologia.
5. Se houver recursos disponíveis, ajuste a metodologia.
6. Se for 'ja_tenho', a prática será reaplicada em outra turma? Se sim, adapte.
7. Se `already_tried` foi preenchido, NÃO repita o que falhou.
8. Se for 'criar', qual a duração pedida? Ajuste o cronograma.
9. Há alunos com necessidade especial? Integre adaptações.
10. A prática é VIÁVEL com os recursos e o tempo?
11. Está alinhada à BNCC da série/etapa?
12. Atende aos 8 critérios do PPAIC?
13. A seção `conexao_avaliacoes` está preenchida e explicada?
14. Se for coordenador, a seção `plano_intervencao` está completa?

═══════════════════════════════════════════════════════════════
O QUE NÃO FAZER
═══════════════════════════════════════════════════════════════
- NÃO faça diagnóstico clínico nem sugira medicação
- NÃO use estereótipos regionais nem invente estatísticas
- NÃO use jargão acadêmico vazio
- NÃO entregue texto genérico que serve para qualquer escola
- NÃO ignore os recursos informados
- NÃO invente códigos BNCC
- NÃO invente dados de avaliações
- NÃO rotule alunos ('aluno problema', 'aluno fraco')
- NÃO copie práticas premiadas — use como INSPIRAÇÃO
- NÃO sugira atividades com recursos indisponíveis

═══════════════════════════════════════════════════════════════
TOM DA RESPOSTA
═══════════════════════════════════════════════════════════════
- Profissional, direto, humano
- Foco em ação concreta
- Português brasileiro
- Frases curtas
- O educador deve terminar pensando: 'Consigo fazer isso na minha escola'

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",
}

def _system_para_task(task_type: str, diferenciado: bool = False) -> str:
    """Retorna o prompt de sistema específico para cada tipo de tarefa."""
    instrucoes_gerais = (
        "Você é um especialista em educação brasileira, com domínio da BNCC e de práticas pedagógicas "
        "baseadas em evidências. Gere conteúdo em português brasileiro.\n\n"
        "IMPORTANTE: Retorne APENAS um JSON válido, sem texto antes ou depois, sem marcações ```. "
        "Siga EXATAMENTE a estrutura abaixo:\n\n"
    )

    contexto = CONTEXTOS.get(task_type, CONTEXTOS["neuroaula"])

    if diferenciado and task_type in SCHEMA_DIFERENCIADO:
        if task_type in ("neuroaula", "aula_que_funciona"):
            termo = "AULA DIFERENCIADA"
            explicacao = (
                "Você DEVE gerar DUAS VERSÕES: uma versao_principal (para a turma toda) e uma versao_adaptada "
                "(com ritmo mais lento, instruções curtas, apoio visual reforçado, etapas simplificadas, "
                "para alunos com necessidades específicas). A versão adaptada deve ter mais tempo por etapa, "
                "linguagem acessível e recursos visuais descritos."
            )
        else:
            termo = "MATERIAL DIFERENCIADO"
            explicacao = (
                "Você DEVE gerar DUAS VERSÕES: uma versao_principal (para alunos típicos) e uma versao_adaptada "
                "(simplificada, com apoio visual, instruções curtas, para alunos com necessidades específicas). "
                "A versão adaptada deve ter menos itens, linguagem mais acessível e recursos visuais descritos."
            )

        contexto += f"\n\nATENÇÃO: O professor solicitou {termo}. {explicacao}"
        schema = SCHEMA_DIFERENCIADO[task_type]
    else:
        schema = SCHEMAS.get(task_type, SCHEMAS["neuroaula"])

    return f"{contexto}\n\n{instrucoes_gerais}{schema}"


def _thinking_config():
    """Retorna o ThinkingConfig correto para o nível de pensamento configurado."""
    return types.ThinkingConfig(thinking_level=THINKING_LEVEL)


# ============================================================
# SERVIÇO GEMINI
# ============================================================
class GeminiService:

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada no .env")

        self.client = genai.Client(api_key=self.api_key)
        self.controle = ControleDeUso()

        self._embeddings_index: List[Tuple[str, List[float]]] = []
        self._index_construido = False

    # --------------------------------------------------------
    # CONSTRUÇÃO DO ÍNDICE RAG (chamada no startup)
    # --------------------------------------------------------
    def construir_indice_agora(self):
        """Constrói o índice RAG. Chamado no startup do app."""
        if self._index_construido:
            return
        print("[RAG] Construindo índice de conhecimento pedagógico...")
        inicio = time.time()
        for item in CONHECIMENTO_PEDAGOGICO:
            try:
                result = self.client.models.embed_content(
                    model=MODELO_EMBEDDINGS,
                    contents=item["texto"],
                    config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
                )
                self._embeddings_index.append((item["texto"], result.embeddings[0].values))
            except Exception as e:
                print(f"[RAG] Erro ao gerar embedding: {e}")
        self._index_construido = True
        duracao = time.time() - inicio
        print(f"[RAG] Índice construído com {len(self._embeddings_index)} itens em {duracao:.1f}s")

    def _construir_indice(self):
        if self._index_construido:
            return
        self.construir_indice_agora()

    # --------------------------------------------------------
    # REPARO DE JSON TRUNCADO
    # --------------------------------------------------------
    def _reparar_json(self, texto: str) -> Optional[Dict[str, Any]]:
        """
        Tenta reparar um JSON truncado (quando o modelo atinge o limite de tokens
        antes de fechar as chaves/colchetes). Estratégia: fecha estruturas abertas.
        """
        try:
            # Encontra o último caractere válido de estrutura
            texto = texto.strip()

            # Remove vírgulas e dois-pontos soltos no final
            texto = texto.rstrip()
            while texto and texto[-1] in (",", ":"):
                texto = texto[:-1].rstrip()

            # Conta estruturas abertas
            pilha = []
            dentro_string = False
            escapado = False

            for char in texto:
                if escapado:
                    escapado = False
                    continue
                if char == "\\":
                    escapado = True
                    continue
                if char == '"':
                    dentro_string = not dentro_string
                    continue
                if dentro_string:
                    continue
                if char in "{[":
                    pilha.append(char)
                elif char == "}" and pilha and pilha[-1] == "{":
                    pilha.pop()
                elif char == "]" and pilha and pilha[-1] == "[":
                    pilha.pop()

            # Fecha as estruturas abertas na ordem inversa
            fechamento = ""
            while pilha:
                abertura = pilha.pop()
                if abertura == "{":
                    fechamento += "}"
                elif abertura == "[":
                    fechamento += "]"

            if not fechamento:
                return None

            texto_reparado = texto + fechamento
            return json.loads(texto_reparado)
        except Exception as e:
            print(f"[Gemini] Falha ao reparar JSON: {e}")
            return None

    # --------------------------------------------------------
    # RETRY
    # --------------------------------------------------------
    def _executar_com_retry(self, funcao, *args, **kwargs):
        """Executa com retry curto. Se falhar 2x, deixa o loop trocar de modelo rapidamente."""
        ultima_excecao = None
        for tentativa in range(1, MAX_RETRIES + 1):
            try:
                return funcao(*args, **kwargs)
            except Exception as e:
                erro_str = str(e)
                ultima_excecao = e
                if "503" in erro_str or "UNAVAILABLE" in erro_str or "429" in erro_str:
                    if tentativa < MAX_RETRIES:
                        espera = BACKOFF_BASE * tentativa
                        print(f"[Gemini] Erro temporário ({tentativa}/{MAX_RETRIES}). Aguardando {espera}s...")
                        time.sleep(espera)
                        continue
                raise e
        raise ultima_excecao

    # --------------------------------------------------------
    # RAG
    # --------------------------------------------------------
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(x * x for x in b))
        if na == 0 or nb == 0:
            return 0.0
        return dot / (na * nb)

    def _buscar_conhecimento(self, consulta: str, top_k: int = 3) -> str:
        try:
            self._construir_indice()
            if not self._embeddings_index:
                return ""
            result = self.client.models.embed_content(
                model=MODELO_EMBEDDINGS,
                contents=consulta,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            consulta_emb = result.embeddings[0].values
            scored = [
                (self._cosine_similarity(consulta_emb, emb), texto)
                for texto, emb in self._embeddings_index
            ]
            scored.sort(reverse=True, key=lambda x: x[0])
            return "\n\n".join([texto for _, texto in scored[:top_k]])
        except Exception as e:
            print(f"[RAG] Erro na busca: {e}")
            return ""

    # --------------------------------------------------------
    # CHAT (Terapia Pedagógica) — sem streaming
    # --------------------------------------------------------
    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        direcionamento_estagio: str = None,
        contexto_tema: str = None,
    ) -> str:
        if not self.controle.pode_usar():
            return self.controle.mensagem_limite()

        ultima_msg = messages[-1]["content"] if messages else ""
        conhecimento = self._buscar_conhecimento(ultima_msg)

        system_instruction = SYSTEM_THERAPY
        if contexto_tema:
            system_instruction += f"\n\n=== CONTEXTO DO TEMA ESCOLHIDO ===\n{contexto_tema}"
        if conhecimento:
            system_instruction += f"\n\n=== CONHECIMENTO PEDAGÓGICO RELEVANTE ===\n{conhecimento}"
        if direcionamento_estagio:
            system_instruction += f"\n\n=== DIRECIONAMENTO PARA ESTA RESPOSTA ===\n{direcionamento_estagio}"

        historico = "\n".join([
            f"{'Professor' if m['role'] == 'user' else 'Assistente'}: {m['content']}"
            for m in messages[-6:]
        ])

        prompt_completo = (
            f"Histórico:\n{historico}\n\n"
            "Responda à última mensagem do professor seguindo o direcionamento."
        )

        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini] Chat — tentando: {modelo}")
                response = self._executar_com_retry(
                    self.client.models.generate_content,
                    model=modelo,
                    contents=prompt_completo,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        max_output_tokens=2048,
                        thinking_config=_thinking_config(),
                    ),
                )
                self.controle.registrar_uso()
                print(f"[Gemini] Sucesso: {modelo}")
                return response.text
            except Exception as e:
                print(f"[Gemini] Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        self.controle.registrar_uso()
        raise Exception(f"Todos os modelos falharam: {ultimo_erro}")

    # --------------------------------------------------------
    # CHAT COM STREAMING (Situação Pedagógica)
    # --------------------------------------------------------
    async def generate_chat_stream(
        self,
        messages: List[Dict[str, str]],
        direcionamento_estagio: str = None,
        contexto_tema: str = None,
    ) -> AsyncGenerator[str, None]:
        """Gera resposta em streaming para a Situação Pedagógica."""
        if not self.controle.pode_usar():
            yield self.controle.mensagem_limite()
            return

        ultima_msg = messages[-1]["content"] if messages else ""
        conhecimento = self._buscar_conhecimento(ultima_msg)

        system_instruction = SYSTEM_THERAPY
        if contexto_tema:
            system_instruction += f"\n\n=== CONTEXTO DO TEMA ESCOLHIDO ===\n{contexto_tema}"
        if conhecimento:
            system_instruction += f"\n\n=== CONHECIMENTO PEDAGÓGICO RELEVANTE ===\n{conhecimento}"
        if direcionamento_estagio:
            system_instruction += f"\n\n=== DIRECIONAMENTO PARA ESTA RESPOSTA ===\n{direcionamento_estagio}"

        historico = "\n".join([
            f"{'Professor' if m['role'] == 'user' else 'Assistente'}: {m['content']}"
            for m in messages[-8:]
        ])

        prompt_completo = (
            f"Histórico:\n{historico}\n\n"
            "Responda à última mensagem do professor seguindo o direcionamento."
        )

        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini] Chat STREAM — tentando: {modelo}")
                chat = self.client.chats.create(
                    model=modelo,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.7,
                        max_output_tokens=2048,
                        thinking_config=_thinking_config(),
                    ),
                )
                for chunk in chat.send_message_stream(prompt_completo):
                    if chunk.text:
                        yield chunk.text
                self.controle.registrar_uso()
                print(f"[Gemini] STREAM Sucesso: {modelo}")
                return
            except Exception as e:
                print(f"[Gemini] STREAM Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        self.controle.registrar_uso()
        yield f"[Erro] Todos os modelos falharam: {ultimo_erro}"

    # --------------------------------------------------------
    # GERAÇÃO ESTRUTURADA
    # --------------------------------------------------------
    def generate_structured(
        self,
        task_type: str,
        payload: Dict[str, Any],
        diferenciado: bool = False,
    ) -> Dict[str, Any]:
        if not self.controle.pode_usar():
            return {"erro": self.controle.mensagem_limite()}

        if task_type not in SCHEMAS:
            return {"erro": f"Tipo não suportado: {task_type}"}

        system_prompt = _system_para_task(task_type, diferenciado=diferenciado)

        if task_type not in TAREFAS_SEM_RAG:
            conteudo = payload.get("content") or payload.get("tema") or ""
            conhecimento = self._buscar_conhecimento(conteudo)
            if conhecimento:
                system_prompt += f"\n\n=== CONHECIMENTO PEDAGÓGICO RELEVANTE ===\n{conhecimento}"

        prompt = (
            f"Dados da solicitação:\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n"
            "Gere o JSON conforme a estrutura especificada."
        )

        max_tokens = 32768 if diferenciado else 16384

        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini] Structured ({task_type}{' diferenciado' if diferenciado else ''}) — tentando: {modelo}")
                response = self._executar_com_retry(
                    self.client.models.generate_content,
                    model=modelo,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.5,
                        max_output_tokens=max_tokens,
                        response_mime_type="application/json",
                        thinking_config=_thinking_config(),
                    ),
                )
                self.controle.registrar_uso()
                texto = response.text.strip()
                if texto.startswith("```"):
                    texto = texto.split("```")[1]
                    if texto.startswith("json"):
                        texto = texto[4:]
                texto = texto.strip()

                # Tenta parsear direto
                try:
                    resultado = json.loads(texto)
                    print(f"[Gemini] Sucesso: {modelo}")
                    return resultado
                except json.JSONDecodeError:
                    # Tenta reparar JSON truncado
                    resultado = self._reparar_json(texto)
                    if resultado is not None:
                        print(f"[Gemini] Sucesso (JSON reparado): {modelo}")
                        return resultado
                    raise
            except json.JSONDecodeError as e:
                print(f"[Gemini] JSON inválido com {modelo}: {e}")
                ultimo_erro = e
                continue
            except Exception as e:
                print(f"[Gemini] Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        self.controle.registrar_uso()
        return {"erro": f"Todos os modelos falharam: {ultimo_erro}"}

    # --------------------------------------------------------
    # GERAÇÃO ESTRUTURADA COM STREAMING
    # --------------------------------------------------------
    async def generate_structured_stream(
        self,
        task_type: str,
        payload: Dict[str, Any],
    ) -> AsyncGenerator[str, None]:
        """Streaming de geração estruturada (JSON aparece progressivamente)."""
        if not self.controle.pode_usar():
            yield self.controle.mensagem_limite()
            return

        if task_type not in SCHEMAS:
            yield f'{{"erro": "Tipo não suportado: {task_type}"}}'
            return

        system_prompt = _system_para_task(task_type, diferenciado=False)

        if task_type not in TAREFAS_SEM_RAG:
            conteudo = payload.get("content") or payload.get("tema") or ""
            conhecimento = self._buscar_conhecimento(conteudo)
            if conhecimento:
                system_prompt += f"\n\n=== CONHECIMENTO PEDAGÓGICO RELEVANTE ===\n{conhecimento}"

        prompt = (
            f"Dados da solicitação:\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n"
            "Gere o JSON conforme a estrutura especificada."
        )

        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini] Structured STREAM ({task_type}) — tentando: {modelo}")
                chat = self.client.chats.create(
                    model=modelo,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7,
                        max_output_tokens=8192,
                        thinking_config=_thinking_config(),
                    ),
                )
                for chunk in chat.send_message_stream(prompt):
                    if chunk.text:
                        yield chunk.text
                self.controle.registrar_uso()
                print(f"[Gemini] STREAM Sucesso: {modelo}")
                return
            except Exception as e:
                print(f"[Gemini] STREAM Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        self.controle.registrar_uso()
        yield f'{{"erro": "Todos os modelos falharam: {str(ultimo_erro)}"}}'


    # --------------------------------------------------------
    # GERAÇÃO DE IMAGEM
    # --------------------------------------------------------
    async def generate_image(self, prompt: str) -> str:
        """
        Gera uma imagem a partir de um prompt usando Gemini.
        Retorna uma data URL (base64) pronta para exibir no navegador.
        """
        if not self.controle.pode_usar():
            raise Exception(self.controle.mensagem_limite())

        MODELO_IMAGEM = "gemini-3.1-flash-lite-image"

        try:
            response = self.client.models.generate_content(
                model=MODELO_IMAGEM,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )
            self.controle.registrar_uso()

            # Extrai a imagem dos parts da resposta
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                    mime = part.inline_data.mime_type or "image/png"
                    return f"data:{mime};base64,{b64}"

            raise Exception("Nenhuma imagem foi retornada pela IA.")
        except Exception as e:
            print(f"[Gemini] Erro ao gerar imagem: {e}")
            raise

        
# ============================================================
# INSTÂNCIA GLOBAL + CONSTRUÇÃO NO STARTUP
# ============================================================
_gemini_instance = None


def get_gemini_service() -> GeminiService:
    global _gemini_instance
    if _gemini_instance is None:
        _gemini_instance = GeminiService()
    return _gemini_instance


def inicializar_rag_no_startup():
    try:
        service = get_gemini_service()
        service.construir_indice_agora()
    except Exception as e:
        print(f"[RAG] Erro ao construir índice no startup: {e}")