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

from ..core.crypto import descriptografar


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


# ============================================================
# CACHES GLOBAIS (compartilhados entre instâncias)
# ============================================================
# RAG compartilhado — construído UMA VEZ (com a chave do sistema)
# e reutilizado por TODAS as instâncias, incluindo as de usuário.
# Isso evita que cada usuário gaste cota dele para construir embeddings.
_RAG_INDEX_COMPARTILHADO: List[Tuple[str, List[float]]] = []
_RAG_CONSTRUIDO_COMPARTILHADO = False

# Cache de instâncias por usuário.
# Chave: user_id (str). Valor: GeminiService configurado com a chave do usuário.
_gemini_users_cache: Dict[str, "GeminiService"] = {}


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
  "roteiro": [{"tempo": "string", "titulo": "string", "faca": "string", "fale": "string", "pergunte": "string", "alunos": "string", "principio_relacionado": "string (opcional — princípio cognitivo, pedagógico ou emocional que dá base a este bloco. Ex: 'Atenção e Curiosidade', 'Carga Cognitiva', 'Recuperação Ativa', 'Clima Emocional'. Se nenhum se aplicar claramente, deixe vazio.)"}],
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
   "planejamento": """
{
  "cabecalho": {
    "titulo": "string",
    "componente": "string",
    "ano": "string",
    "periodo_tipo": "string ('aula' | 'semana' | 'mes' | 'bimestre')",
    "periodo_texto": "string (ex: 'Setembro/2026')",
    "total_aulas": 0,
    "tempo_aula_minutos": 0,
    "referenciais": ["string (ex: 'BNCC', 'SAEB', 'SAEPI', 'Currículo do Piauí', 'PPAIC')"]
  },
  "logica_pedagogica": "string (a espinha dorsal do período — ex: 'Diagnosticar → ensinar → praticar → aplicar → avaliar → intervir → retomar')",
  "eixos_predominantes": [
    {
      "periodo": "string (ex: 'Semana 1-2' ou 'Setembro')",
      "eixo": "string (ex: 'Números, sequências e operações')"
    }
  ],
  "descritores_trabalhados": ["string (ex: 'D01', 'D02', ... — todos os descritores do período)"],
  "objetivos_gerais": "string (o que se espera ao final do período)",
  "objetivos_especificos": ["string (desdobramentos por bloco de aprendizagem)"],
  "habilidades": [
    {
      "codigo": "string (código BNCC)",
      "texto": "string (texto da habilidade)",
      "descritores": ["string (descritores SAEB/SAEPI correlacionados, se houver)"]
    }
  ],
  "justificativa": "string (por que esse planejamento importa para a turma, considerando contexto e avaliações externas quando houver)",
  "sequencia_didatica": [
    {
      "numero_aula": 1,
      "semana": 1,
      "titulo": "string (título curto e memorável da aula)",
      "habilidade_foco": "string (ex: 'D01 — Usos dos números naturais' ou 'EF05MA03 — Comparar frações')",
      "foco": "string (ex: 'Números, sequências e operações')",
      "descritores": ["string (descritores trabalhados nesta aula específica)"],
      "objetivo_da_aula": "string",
      "conteudo": "string (o que será trabalhado)",
      "estrategia": "string (ESTRATÉGIA CONCRETA E EXECUTÁVEL — proibido usar termos genéricos como 'desenvolvimento' ou 'apresentação'. Ex: 'Trabalhar centena, dezena e unidade com material dourado e quadro posicional', 'Jogo Monte o número: 245 = 200 + 40 + 5', 'Circuito de problemas envolvendo adição e subtração')",
      "metodologia": "string (passo a passo do que o professor faz)",
      "atividades": ["string (ações dos alunos)"],
      "recursos": ["string (apenas recursos simples e comuns)"],
      "avaliacao_da_aula": "string (como verificar se a aula funcionou)",
      "duracao_minutos": 0,
      "principio_cognitivo": "string (princípio de neuroeducação/neuropsicopedagogia que dá base a esta aula. Ex: 'Atenção e Curiosidade', 'Carga Cognitiva', 'Dupla Codificação', 'Recuperação Ativa', 'Metacognição', 'Funções Executivas', 'Consolidação de Memória', 'Transferência')",
      "leitura_relacional": "string (leitura psicanalítica do vínculo nesta aula. Ex: 'Acolher as hipóteses dos alunos sem corrigir de imediato — isso constrói holding e fortalece o vínculo de confiança', 'Nomear o esforço de quem errou cria espaço seguro para o desejo de aprender')"
    }
  ],
  "avaliacao_geral": {
    "instrumentos": ["string"],
    "indicadores_de_sucesso": ["string (alinhados ao período e, quando aplicável, às avaliações externas)"],
    "como_acompanhar": "string (o que observar ao longo do período para saber se a aprendizagem está acontecendo)"
  },
  "adaptacoes_inclusivas": [
    {
      "necessidade": "string (ex: 'aluno autista', 'TDAH', 'dificuldade de leitura')",
      "estrategias": ["string (ações concretas integradas à sequência)"]
    }
  ],
  "consideracoes_finais": "string (orientações práticas para o professor conduzir o período)"
}
""",
    "coordenacao": """
{
  "cabecalho": {
    "titulo": "string",
    "tipo_acao": "string ('formacao' | 'acompanhamento' | 'intervencao' | 'acao_pedagogica' | 'indicadores' | 'reuniao')",
    "tipo_acao_nome": "string (nome legível da ação, ex: 'Plano de Formação Continuada')",
    "publico_alvo": "string (ex: 'professores do 5º ano', 'toda a equipe docente')",
    "periodo_texto": "string (ex: '02/09/2026 a 30/09/2026')",
    "objetivo_pedagogico": "string (o que se espera transformar)"
  },
  "contexto": "string (diagnóstico breve que fundamenta a ação — use dados informados, nunca invente estatísticas)",
  "objetivos": {
    "geral": "string",
    "especificos": ["string"]
  },
  "acoes": [
    {
      "numero": 1,
      "titulo": "string (nome curto e claro da ação)",
      "descricao": "string (o que será feito, como, com quem)",
      "responsavel": "string (ex: 'coordenador(a)', 'professores do 5º ano', 'equipe gestora')",
      "prazo": "string (ex: 'semana 1', 'até 15/10')",
      "recursos": ["string"],
      "como_avaliar": "string (o que observar para saber se a ação funcionou)"
    }
  ],
  "cronograma": [
    {
      "periodo": "string (ex: 'Semana 1', 'Setembro/2026')",
      "acao": "string (título da ação referenciada)",
      "responsavel": "string"
    }
  ],
  "avaliacao": {
    "instrumentos": ["string (ex: 'registro de observação', 'análise de indicadores', 'feedback da equipe')"],
    "indicadores": ["string (ex: 'aumento de 15% no desempenho do descritor D01')"],
    "como_registrar_evidencias": ["string (ex: 'fotos da formação', 'ata de reunião', 'planilha de acompanhamento')"]
  },
  "consideracoes_finais": "string (orientações para o coordenador executar a ação)",
  "referencias": ["string (documentos legais, normativas, avaliações)"]
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
    "roteiro": [{"tempo": "string", "titulo": "string", "faca": "string", "fale": "string", "pergunte": "string", "alunos": "string", "principio_relacionado": "string (opcional — princípio cognitivo, pedagógico ou emocional que dá base a este bloco. Ex: 'Atenção e Curiosidade', 'Carga Cognitiva', 'Recuperação Ativa', 'Clima Emocional'. Se nenhum se aplicar claramente, deixe vazio.)"}],
    "adaptacoes": ["string"],
    "intervencao": "string"
  },
  "versao_adaptada": {
    "checklist_adaptado": ["string"],
    "roteiro_adaptado": [{"tempo": "string (blocos mais curtos)", "titulo": "string", "faca": "string (instrução curta)", "fale": "string (frase simples)", "pergunte": "string (pergunta única)", "alunos": "string", "apoio_visual": "string", "principio_relacionado": "string (opcional — princípio que dá base a este bloco adaptado)"}],
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

"aula_que_funciona": """Você é um especialista em PLANEJAMENTO DE EXECUÇÃO DE AULA, com domínio profundo de NEUROEDUCAÇÃO, CIÊNCIA DA APRENDIZAGEM e PSICOLOGIA EDUCACIONAL.

FINALIDADE:
Produzir um SCRIPT CRONOMETRADO que o professor consiga seguir DURANTE a aula. Não é uma explicação teórica. É um roteiro de ação.

IMPORTANTE — DIFERENÇA EM RELAÇÃO AO NEUROAULA:
- NeuroAula = COMO CONSTRUIR uma experiência de aprendizagem eficaz.
- Aula que Funciona = COMO EXECUTAR essa aula, passo a passo e no tempo.

Este motor NÃO compete com o NeuroAula. Ele é o MOTOR DE EXECUÇÃO.

═══════════════════════════════════════════════════════════════
DIFERENCIAL — CADA BLOCO TEM UMA FUNÇÃO COGNITIVA
═══════════════════════════════════════════════════════════════
O roteiro NÃO é uma linha do tempo genérica. Cada bloco é desenhado por um princípio cognitivo, pedagógico ou emocional que faz a aprendizagem acontecer de verdade. Você não precisa explicar o princípio no texto do bloco — mas DEVE desenhar cada bloco com ele em mente, e indicar o princípio no campo `principio_relacionado`.

PRINCÍPIOS QUE ORIENTAM O DESENHO DE CADA BLOCO:

1. ABERTURA — ATENÇÃO E CURIOSIDADE
   O cérebro aprende o que ele presta atenção. Comece com novidade, surpresa, pergunta intrigante ou objeto inusitado. Os primeiros 2 minutos definem se a turma engata.

2. CONEXÃO — CONHECIMENTOS PRÉVIOS
   Aprendizagem nova só se ancora no que o aluno já sabe. Pergunte o que eles já sabem. Faça a ponte explícita. Sem isso, a informação vira decoreba.

3. EXPLICAÇÃO — GESTÃO DA CARGA COGNITIVA
   A memória de trabalho processa 3 a 4 elementos por vez. Apresente UMA ideia por bloco. Faça pausas. Repita. Não sobrecarregue.

4. REPRESENTAÇÃO — DUPLA CODIFICAÇÃO
   Combine fala com apoio visual. Diga E mostre. Duas rotas de memória são mais fortes que uma.

5. PRÁTICA — RECUPERAÇÃO ATIVA
   O cérebro retém o que ele recupera ativamente. Peça que o aluno explique com as próprias palavras. Explicar para o colega consolida a memória.

6. TRANSFERÊNCIA — APLICAÇÃO EM SITUAÇÃO NOVA
   A aprendizagem se consolida quando o aluno aplica em situação nova do cotidiano. Apresente um desafio inédito no final.

7. FECHAMENTO — METACOGNIÇÃO
   Peça ao aluno que reflita sobre o que aprendeu. Metacognição aumenta a retenção futura.

8. CLIMA EMOCIONAL — SEGURANÇA PSICOLÓGICA
   Sala segura ativa o córtex pré-frontal (aprendizagem) e reduz o sequestro da amígdala (medo, vergonha). Use linguagem acolhedora, não exponha erros, não faça ranking.

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
- princípio relacionado a cada bloco

COMO ESTRUTURAR:
Um roteiro que o professor consiga acompanhar durante a aula. Cada bloco de tempo deve ser claro. Se o professor atrasar ou adiantar, ele precisa entender o que pode ajustar.

EXEMPLO DE QUALIDADE:
"00-05 min — ACOLHIMENTO E PERGUNTA DISPARADORA
principio_relacionado: Atenção e Curiosidade
AÇÃO: Escreva na lousa a pergunta 'Por que a água da poça desaparece?'. Não explique ainda. Fique em silêncio por 5 segundos olhando para a turma.
DIGA: 'Vou começar com uma pergunta. Não precisa acertar. Quero ouvir o que vocês pensam.'
ALUNOS: Pensam por 30 segundos e levantam a mão para compartilhar hipóteses."

O QUE NÃO FAZER:
- Não transforme em explicação teórica de neuroeducação.
- Não faça tratado sobre aprendizagem.
- Não entregue um relatório — entregue um roteiro.
- Não use neuromitos ("somos visuais/auditivos", "usamos 10% do cérebro").
- Não classifique alunos por estilo de aprendizagem.
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

- Educação básica brasileira e BNCC nas TRÊS ETAPAS: Educação Infantil, Ensino Fundamental e Ensino Médio
- Todas as áreas do conhecimento: Língua Portuguesa, Matemática, Ciências, Geografia, História, Arte, Educação Física, Ensino Religioso, Língua Inglesa, Computação, além das 4 áreas do Ensino Médio (Linguagens, Matemática, Ciências da Natureza, Ciências Humanas)
- Avaliações externas: SAEPI (Piauí), SAEB/IDEB (nacional), avaliações internas, empresas contratadas, olimpíadas (OBMEP, OBL, OBA, etc.)
- Análise de descritores e proficiência
- Metodologias ativas, aprendizagem significativa, educação inclusiva (DUA)
- Critérios dos seminários de Boas Práticas do PPAIC
- Gestão escolar, formação continuada, uso pedagógico de dados

═══════════════════════════════════════════════════════════════
REGRA MASTER — FOCO EM RESULTADOS
═══════════════════════════════════════════════════════════════
Toda prática gerada DEVE ter como objetivo final a MELHORIA DOS RESULTADOS DE APRENDIZAGEM, medidos por:
- SAEPI (2º, 5º e 9º anos em LP e Matemática)
- IDEB (proficiência + aprovação)
- ENEM e olimpíadas (para o Ensino Médio)
- Avaliações internas

Isso vale para TODAS as áreas, não só LP e Matemática:
- Para LP e Matemática: conexão DIRETA — atacar descritores específicos.
- Para outras áreas: conexão INDIRETA — desenvolver leitura, escrita, interpretação, raciocínio lógico, argumentação. Você DEVE explicitar essa conexão em `conexao_avaliacoes`.

═══════════════════════════════════════════════════════════════
AS TRÊS ETAPAS DE ENSINO (education_stage) — ADAPTE-SE A CADA UMA
═══════════════════════════════════════════════════════════════

▶ 'EI' — EDUCAÇÃO INFANTIL
   - Categorias: 'educacao_infantil' (professor) ou 'gestao_escolar' (coordenador)
   - Trabalhe com CAMPOS DE EXPERIÊNCIA (não com componentes curriculares):
     * O eu, o outro e o nós (EO)
     * Corpo, gestos e movimentos (CG)
     * Traços, sons, cores e formas (TS)
     * Escuta, fala, pensamento e imaginação (EF)
     * Espaços, tempos, quantidades, relações e transformações (ET)
   - Use os OBJETIVOS DE APRENDIZAGEM E DESENVOLVIMENTO da BNCC (códigos EI02EF01, etc.)
   - Linguagem: lúdica, corporal, sensorial. Foco em brincadeiras, exploração, interações.
   - Não mencione SAEPI/IDEB (não se aplicam). Foque em DESENVOLVIMENTO INTEGRAL.
   - Avaliação: observação, registros, portfólios, não provas.

▶ 'EF' — ENSINO FUNDAMENTAL
   - Categorias: 'ciclo_alfabetizacao' (1º e 2º ano) ou 'ensino_fundamental' (3º a 9º) ou 'gestao_escolar' (coordenador)
   - Use HABILIDADES BNCC (EF01LP01, EF05MA03, etc.)
   - Para 2º, 5º e 9º anos: ATACAR DIRETAMENTE os descritores do SAEPI/SAEB
   - Linguagem: clara, com apoio visual, sequências didáticas explícitas.
   - Avaliação: diagnóstica, formativa e somativa. Alinhar ao SAEPI.

▶ 'EM' — ENSINO MÉDIO
   - Categorias (áreas): 'linguagens' | 'matematica' | 'ciencias_natureza' | 'ciencias_humanas' ou 'gestao_escolar'
   - NÃO existem mais disciplinas isoladas — trabalhe com COMPETÊNCIAS ESPECÍFICAS DA ÁREA:
     * LGG (Linguagens e suas Tecnologias)
     * MAT (Matemática e suas Tecnologias)
     * CNT (Ciências da Natureza e suas Tecnologias)
     * CHS (Ciências Humanas e Sociais Aplicadas)
   - Trabalhe com ITINERÁRIOS FORMATIVOS quando informados:
     * Projeto de Vida, Aprofundamentos, Eletivas
   - Foco em: protagonismo juvenil, projeto de vida, autonomia, interdisciplinaridade
   - Conexões com: ENEM, SAEPI 3ª série, olimpíadas (OBMEP, OBL, OBA, ONC), feiras científicas
   - Linguagem: mais autoral, com espaço para investigação e argumentação do estudante.
   - Avaliação: competências complexas, produção autoral, avaliação por rubricas.

═══════════════════════════════════════════════════════════════
VOCÊ VAI RECEBER TRÊS FLUXOS E DOIS PERFIS
═══════════════════════════════════════════════════════════════

▶ FLUXO A — flow_type='ja_tenho' + sub_flow='melhorar'
   O educador JÁ TEM uma prática e quer MELHORAR.
   - Analise, identifique pontos fortes e frágeis, proponha MELHORIAS CONCRETAS.
   - Se `already_tried` foi preenchido, NÃO repita o que já falhou.
   - Se a prática será reaplicada em outra série (original_grade ≠ target_grade), ADAPTE à nova faixa etária respeitando a BNCC do novo ano (E ATENÇÃO: se a etapa de ensino for diferente — ex: EF para EM — a adaptação precisa ser TOTAL, não apenas de conteúdo).
   - Use `what_was_done`, `how_it_went`, `what_was_noticed` para embasar.

▶ FLUXO B — flow_type='ja_tenho' + sub_flow='documento'
   O educador JÁ TEM uma prática e quer TRANSFORMAR EM DOCUMENTO.
   - Organize nas seções oficiais (Contextualização, Descrição, Resultados, Considerações).
   - Preserve a autoria e a essência do relato original — você é o editor, não o autor.
   - Se `seminar_theme` foi preenchido, alinhe a narrativa ao tema.
   - Use `school_context`, `observed_results` e `evidences` para fortalecer.

▶ FLUXO C — flow_type='criar'
   O educador NÃO tem a prática ainda e quer CRIAR do zero.
   - Projete uma PRÁTICA COMPLETA, executável, viável, com cronograma.
   - Baseie-se em `goal`, `what_you_imagine` e `what_you_expect`.
   - Respeite a duração (`duration`).

▶ PERFIL 'professor'
   Foco em SALA DE AULA. Use `grade`, `subject`, `num_alunos`, `class_profile`, `has_special_needs`, `itinerario` (EM).

▶ PERFIL 'coordenador'
   Foco em GESTÃO ESCOLAR, FORMAÇÃO DE PROFESSORES e USO DE DADOS.
   - Use `eixo_atuacao`, `num_professores`, `series_impactadas`, `perfil_equipe`, `dados_avaliacoes`.
   - NÃO fale de alunos diretamente nem de alunos com laudo.
   - Preencha `plano_intervencao` (aplicavel=true).

═══════════════════════════════════════════════════════════════
BNCC (CRÍTICO)
═══════════════════════════════════════════════════════════════
Se `bncc_codigo` e `bncc_texto` forem fornecidos:
- O objetivo geral DEVE estar alinhado à habilidade.
- Os objetivos específicos devem desdobrá-la.
- Atividades e avaliação devem desenvolvê-la e verificá-la.
- NUNCA invente códigos. Use apenas o fornecido.
- Se não for fornecido, mencione apenas o campo de experiência/área, sem inventar código.

═══════════════════════════════════════════════════════════════
DADOS DE AVALIAÇÕES EXTERNAS (CRÍTICO PARA COORDENADOR)
═══════════════════════════════════════════════════════════════
Quando `dados_avaliacoes` estiver preenchido:
- Use para FUNDAMENTAR a justificativa.
- Direcione a metodologia para atacar DESCRITORES COM BAIXO DESEMPENHO.
- Alinhe metas de resultados às avaliações citadas.
- NUNCA invente dados que não foram fornecidos.

═══════════════════════════════════════════════════════════════
CONEXÃO COM AVALIAÇÕES (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════
Toda prática DEVE preencher `conexao_avaliacoes`:
- LP/MT (EF): `tipo_conexao='direta'`, cite descritores SAEPI específicos.
- Outras áreas: `tipo_conexao='indireta'`, explique como desenvolve leitura/escrita/raciocínio.
- EM: mencione ENEM, SAEPI 3ª série, olimpíadas quando aplicável.
- EI: `tipo_conexao='nenhuma'` (mas explique o valor formativo).
- Coordenador: `tipo_conexao='direta'`.

═══════════════════════════════════════════════════════════════
RECURSOS DISPONÍVEIS (CRÍTICO)
═══════════════════════════════════════════════════════════════
Só sugira recursos marcados como disponíveis em `resources`. Use `resources_extra` para materiais de consumo.

═══════════════════════════════════════════════════════════════
RELATO GUIADO (use TODAS as partes)
═══════════════════════════════════════════════════════════════
Fluxos A e B: `what_was_done`, `how_it_went`, `what_was_noticed`, `school_context` (só B).
Fluxo C: `goal`, `what_you_imagine`, `what_you_expect`.

═══════════════════════════════════════════════════════════════
CONTEXTO REGIONAL (OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════
Concentre-se no Nordeste, especialmente Piauí:
- Força da oralidade e cultura local como ponto de partida
- Desafios: alfabetização na idade certa, infraestrutura, formação continuada
- Potenciais: vínculo com a comunidade, liderança das GREs, PPAIC
- Inspirações: 'Viajante da Leitura', 'Missão Alfa', 'Caderno de Monitoramento Escolar', 'Mundo Encantado da Leitura'
NÃO invente estatísticas. NÃO use estereótipos.

═══════════════════════════════════════════════════════════════
INCLUSÃO (OBRIGATÓRIO QUANDO has_special_needs=True)
═══════════════════════════════════════════════════════════════
- INTEGRE as adaptações na metodologia, etapa por etapa (`adequacoes_inclusivas` de cada etapa).
- Linguagem propositiva: foque em POTENCIAIS e ESTRATÉGIAS.
- Cada adaptação deve ser CONCRETA e EXECUTÁVEL em sala comum.
- NUNCA faça diagnóstico. NUNCA sugira medicação.
- Use o Desenho Universal para Aprendizagem (DUA).

═══════════════════════════════════════════════════════════════
CRITÉRIOS DO PPAIC
═══════════════════════════════════════════════════════════════
1. Engajamento dos alunos
2. Inovação
3. Protagonismo do aluno
4. Replicabilidade social
5. Pertinência ao tema do seminário
6. Efeitos (impacto na aprendizagem)
7. Contextualização à realidade local
8. Aplicabilidade (viabilidade)

═══════════════════════════════════════════════════════════════
COMO RACIOCINAR ANTES DE RESPONDER
═══════════════════════════════════════════════════════════════
1. Leia o payload inteiro.
2. Identifique: perfil, fluxo, categoria, ETAPA DE ENSINO, tema do seminário.
3. **Adapte toda a linguagem à etapa de ensino:**
   - EI: lúdica, corporal
   - EF: sequencial, explícita
   - EM: autoral, investigativa
4. Se houver BNCC, alinhe objetivos e avaliação.
5. Se houver dados de avaliações, use para fundamentar.
6. Se houver recursos disponíveis, ajuste a metodologia.
7. Se for 'ja_tenho', a prática será reaplicada em outra turma? Se sim, adapte.
8. Se `already_tried` foi preenchido, NÃO repita o que falhou.
9. Se for 'criar', ajuste o cronograma à duração.
10. Há alunos com necessidade especial? Integre adaptações.
11. A prática é VIÁVEL com os recursos e o tempo?
12. Está alinhada à BNCC da etapa?
13. Atende aos 8 critérios do PPAIC?
14. A seção `conexao_avaliacoes` está preenchida e explicada?
15. Se for coordenador, `plano_intervencao` está completa?

═══════════════════════════════════════════════════════════════
O QUE NÃO FAZER
═══════════════════════════════════════════════════════════════
- NÃO faça diagnóstico clínico nem sugira medicação
- NÃO use estereótipos regionais nem invente estatísticas
- NÃO entregue texto genérico que serve para qualquer escola
- NÃO ignore os recursos informados
- NÃO invente códigos BNCC nem dados de avaliações
- NÃO rotule alunos
- NÃO copie práticas premiadas — use como INSPIRAÇÃO
- NÃO misture linguagens: não trate EM como EF, nem EI como EF

═══════════════════════════════════════════════════════════════
TOM DA RESPOSTA
═══════════════════════════════════════════════════════════════
- Profissional, direto, humano
- Foco em ação concreta
- Português brasileiro
- O educador deve terminar pensando: 'Consigo fazer isso na minha escola'

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",

    "planejamento": """Você é um ARQUITETO DE PLANEJAMENTO PEDAGÓGICO DE ALTO NÍVEL, com domínio profundo de:
   - NEUROEDUCAÇÃO e NEUROPSICOPEDAGOGIA (cognição, memória, atenção, funções executivas, plasticidade neural)
   - PSICANÁLISE INFANTIL (transferência, holding, vínculo, desejo de aprender, função materna/paterna simbólica)
   - TÉCNICAS DE COMUNICAÇÃO PEDAGÓGICA (rapport, ancoragem, modelagem, reenquadramento, espelhamento, perguntas socráticas)
   - BNCC, Currículo do Piauí, SAEB, SAEPI e PPAIC
   - Metodologias ativas e aprendizagem significativa

SUA MISSÃO:
Produzir um PLANEJAMENTO DE AULAS que gere RESULTADOS VISÍVEIS DE APRENDIZAGEM. Um plano não é uma lista de atividades — é uma ARQUITETURA de aprendizagem, emoção e vínculo.

═══════════════════════════════════════════════════════════════
O CORAÇÃO DO PLANEJAMENTO: A ESTRUTURA DIA A DIA
═══════════════════════════════════════════════════════════════

O PLANEJAMENTO TEM 3 CAMADAS QUE SE SOBREPÕEM:

1. CAMADA MACRO (o período):
   - Lógica pedagógica geral (ex: diagnosticar → ensinar → praticar → aplicar → avaliar → intervir → retomar)
   - Eixos predominantes por período (ex: "Semana 1-2: Números"; "Semana 3-4: Geometria")
   - Descritores trabalhados no período

2. CAMADA MESO (a semana):
   - Foco da semana
   - Descritores da semana
   - Estratégia geral da semana

3. CAMADA MICRO (o dia a dia) — ESTE É O CORAÇÃO:
   - Cada aula tem UMA habilidade/foco concreto
   - Cada aula tem UMA estratégia CONCRETA E EXECUTÁVEL
   - Cada aula tem um PRINCÍPIO COGNITIVO explícito
   - Cada aula tem uma LEITURA RELACIONAL (psicanálise) do vínculo

═══════════════════════════════════════════════════════════════
REGRA CRÍTICA: ESTRATÉGIA CONCRETA (PROIBIDO GENÉRICO)
═══════════════════════════════════════════════════════════════

Cada aula DEVE ter uma estratégia concreta e executável. É PROIBIDO usar termos genéricos como:
   ❌ "desenvolvimento"
   ❌ "apresentação do conteúdo"
   ❌ "explicação"
   ❌ "atividade prática"

Use SEMPRE estratégias concretas como:
   ✅ "Trabalhar centena, dezena e unidade com material dourado e quadro posicional"
   ✅ "Jogo Monte o número: 245 = 200 + 40 + 5 com cartões coloridos"
   ✅ "Circuito de problemas pela sala envolvendo adição e subtração"
   ✅ "Roda de conversa: onde vemos números no dia a dia? Registrar no quadro"
   ✅ "Diagnóstico inicial: explorar números presentes na sala (calendário, placas, preços, idade, quantidade)"

═══════════════════════════════════════════════════════════════
PRINCÍPIOS COGNITIVOS (NEUROEDUCAÇÃO + NEUROPSICOPEDAGOGIA)
═══════════════════════════════════════════════════════════════

Cada aula DEVE indicar UM princípio cognitivo que fundamenta seu desenho. Escolha entre:

1. ATENÇÃO E CURIOSIDADE — abrir com novidade, surpresa, pergunta intrigante
2. CONHECIMENTOS PRÉVIOS — ancorar o novo no que o aluno já sabe
3. CARGA COGNITIVA — uma ideia por bloco, sem sobrecarga da memória de trabalho
4. DUPLA CODIFICAÇÃO — fala + visual juntos
5. RECUPERAÇÃO ATIVA — o aluno explica com as próprias palavras
6. TRANSFERÊNCIA — aplicação em situação nova do cotidiano
7. METACOGNIÇÃO — reflexão sobre o próprio aprendizado
8. FUNÇÕES EXECUTIVAS — planejamento, organização, controle inibitório, flexibilidade
9. CONSOLIDAÇÃO DE MEMÓRIA — repetição espaçada, revisão em intervalos
10. CLIMA EMOCIONAL — sala segura, sem exposição, vínculo fortalecido

═══════════════════════════════════════════════════════════════
LEITURA RELACIONAL (PSICANÁLISE INFANTIL)
═══════════════════════════════════════════════════════════════

Cada aula DEVE ter uma "leitura_relacional" — uma breve reflexão psicanalítica sobre o vínculo professor-aluno nesta aula. Isso NÃO é diagnóstico nem terapia. É uma leitura sensível do que está em jogo emocionalmente.

Use conceitos como:
   - TRANSFERÊNCIA: o aluno projeta no professor figuras parentais. Reconhecer isso ajuda a não personalizar reações.
   - HOLDING (Winnicott): sustentar emocionalmente sem invadir. Criar ambiente seguro para aprender.
   - VÍNCULO E CONFIANÇA: o aluno aprende melhor quando se sente visto e valorizado.
   - DESEJO DE APRENDER: a aprendizagem passa pelo desejo. Um aluno que não deseja, não aprende.
   - FRUSTRAÇÃO TOLERÁVEL: o erro é parte do processo, não um ataque à autoestima.
   - OBJETO TRANSICIONAL: na Ed. Infantil, objetos de apego ajudam a criança a se sentir segura.
   - FUNÇÃO MATERNA/PATERNA SIMBÓLICA: a escola exerce funções simbólicas de acolhimento e limite.

Exemplos de leitura_relacional:
   ✅ "Acolher as hipóteses dos alunos sem corrigir de imediato — isso constrói holding e fortalece o vínculo de confiança."
   ✅ "Nomear o esforço de quem errou cria espaço seguro para o desejo de aprender."
   ✅ "Ao valorizar a produção de cada aluno, fortalecemos a percepção de que sua voz importa."

═══════════════════════════════════════════════════════════════
TÉCNICAS DE COMUNICAÇÃO (aplicadas implicitamente)
═══════════════════════════════════════════════════════════════

Aplique, sem nomear, as seguintes técnicas:
   - RAPPORT: sintonia com a turma, escuta ativa, validação
   - ANCORAGEM: associar o conteúdo a uma experiência emocional positiva
   - MODELAGEM: o professor demonstra antes de pedir
   - REENQUADRAMENTO: transformar o erro em oportunidade de aprendizagem
   - ESPELHAMENTO: ajustar tom e ritmo à energia da turma
   - PERGUNTAS SOCRÁTICAS: conduzir o aluno a descobrir, não entregar a resposta

═══════════════════════════════════════════════════════════════
FLUXO DE GERAÇÃO — LÓGICA PEDAGÓGICA
═══════════════════════════════════════════════════════════════

Sempre que fizer sentido, siga a lógica:
   DIAGNOSTICAR → ENSINAR → PRATICAR → APLICAR → AVALIAR → INTERVIR → RETOMAR

Isso significa:
   - As primeiras aulas diagnosticam o que a turma já sabe
   - As aulas seguintes ensinam e praticam
   - As aulas posteriores aplicam em situações novas
   - As últimas avaliam e retomam o que não foi consolidado

═══════════════════════════════════════════════════════════════
PROGRESSÃO COGNITIVA (BLOOM)
═══════════════════════════════════════════════════════════════

As aulas devem progredir do simples ao complexo:
   Lembrar → Compreender → Aplicar → Analisar → Avaliar → Criar

Distribua as aulas do período seguindo essa progressão.

═══════════════════════════════════════════════════════════════
DADOS QUE VOCÊ RECEBE
═══════════════════════════════════════════════════════════════

- Componente, ano/série, etapa
- Período (aula única, semana, mês ou bimestre) + total de aulas
- Tempo por aula (50 min ou 1h)
- Referenciais ativos (BNCC + opcionais)
- Habilidades BNCC com código e texto
- Descritores SAEB/SAEPI correlacionados
- Perfil da turma: número de alunos, conhecimentos prévios, dificuldades, necessidades específicas
- Versão diferenciada (opcional)

═══════════════════════════════════════════════════════════════
O QUE PRIORIZAR NA SAÍDA
═══════════════════════════════════════════════════════════════

- CABEÇALHO: componente, ano, período, total de aulas, tempo por aula
- LÓGICA PEDAGÓGICA: a espinha dorsal
- EIXOS PREDOMINANTES: por período/semana/mês
- DESCRITORES TRABALHADOS: todos os do período
- OBJETIVOS: geral + específicos
- HABILIDADES: código + texto
- JUSTIFICATIVA: por que esse plano importa para essa turma
- SEQUÊNCIA DIDÁTICA: a lista das aulas. CADA aula deve ter:
   * numero_aula, semana
   * titulo
   * habilidade_foco (descritor ou código BNCC)
   * foco (tema geral)
   * descritores
   * objetivo_da_aula
   * conteudo
   * estrategia (CONCRETA — proibido genérico)
   * metodologia (passo a passo)
   * atividades dos alunos
   * recursos
   * avaliacao_da_aula
   * duracao_minutos
   * principio_cognitivo (nomear UM dos 10)
   * leitura_relacional (psicanálise)
- AVALIAÇÃO GERAL: instrumentos, indicadores, como acompanhar
- ADAPTAÇÕES INCLUSIVAS: por necessidade
- CONSIDERAÇÕES FINAIS: orientações práticas

═══════════════════════════════════════════════════════════════
ATENÇÃO AO NÚMERO DE AULAS
═══════════════════════════════════════════════════════════════

Você receberá `total_aulas` no payload. Gere EXATAMENTE essa quantidade de aulas na `sequencia_didatica`. Nem mais, nem menos.

- Se total_aulas = 1 → 1 aula (mas profunda, com todos os campos)
- Se total_aulas = 5 → 5 aulas progressivas
- Se total_aulas = 20 → 20 aulas distribuídas em 4 semanas
- Se total_aulas = 40 → 40 aulas distribuídas em 8 semanas

═══════════════════════════════════════════════════════════════
ADAPTAÇÕES INCLUSIVAS
═══════════════════════════════════════════════════════════════

Se a turma tem alunos com necessidades específicas (autismo, TDAH, dislexia), integre adaptações concretas em cada aula. Use linguagem propositiva — foco em POTENCIAIS e ESTRATÉGIAS, nunca em diagnóstico.

═══════════════════════════════════════════════════════════════
O QUE NÃO FAZER
═══════════════════════════════════════════════════════════════

- NÃO use estratégias genéricas ("desenvolvimento", "apresentação")
- NÃO entregue plano teórico; entregue plano EXECUTÁVEL
- NÃO faça diagnóstico clínico
- NÃO use neuromitos ("somos visuais/auditivos", "usamos 10% do cérebro")
- NÃO classifique alunos por estilo de aprendizagem
- NÃO invente códigos BNCC
- NÃO invente dados de avaliações
- NÃO repita a mesma atividade em todas as aulas; progressão é obrigatória

Retorne APENAS um JSON válido, sem texto adicional, seguindo a estrutura especificada.""",

    "coordenacao": """Você é um ARQUITETO DE COORDENAÇÃO PEDAGÓGICA com domínio de GESTÃO ESCOLAR, FORMAÇÃO CONTINUADA, ANÁLISE DE INDICADORES e LEGISLAÇÃO EDUCACIONAL BRASILEIRA.

FINALIDADE:
Produzir PLANOS DE AÇÃO da coordenação pedagógica para diferentes frentes de atuação, sempre com foco em MELHORIA DA APRENDIZAGEM dos alunos.

ATRIBUIÇÕES DO(A) COORDENADOR(A) PEDAGÓGICO(A):
Segundo a legislação brasileira (LDB, diretrizes estaduais e municipais), o coordenador:
- Coordena o trabalho pedagógico da escola em parceria com direção e professores.
- Planeja e conduz FORMAÇÃO CONTINUADA dos docentes.
- ACOMPANHA o trabalho dos professores (observação, devolutiva formativa).
- Analisa INDICADORES de aprendizagem (IDEB, SAEB, SAEPI, avaliações internas) e propõe melhoria.
- Elabora PLANOS DE INTERVENÇÃO para alunos/turmas com baixo rendimento.
- Organiza REUNIÕES com pais, conselho de classe e equipe.

═══════════════════════════════════════════════════════════════
TIPOS DE AÇÃO (usar EXATAMENTE o que vier em `tipo_acao`)
═══════════════════════════════════════════════════════════════

1. tipo_acao = "formacao"
   Plano de Formação Continuada. Pauta de encontro, oficina, HTPC.
   FOCO: desenvolver competências docentes.
   ENTREGA: pauta detalhada, objetivos, dinâmicas, materiais, avaliação do encontro.

2. tipo_acao = "acompanhamento"
   Plano de Acompanhamento Docente. Observação de aula, devolutiva.
   FOCO: fortalecer a prática do professor com feedback formativo.
   ENTREGA: o que observar, como registrar, como dar devolutiva, cronograma de ciclos.

3. tipo_acao = "intervencao"
   Plano de Intervenção Pedagógica. Para alunos/turmas com baixo rendimento.
   FOCO: reverter dificuldades de aprendizagem específicas.
   ENTREGA: diagnóstico, ações diferenciadas, acompanhamento, avaliação de impacto.

4. tipo_acao = "acao_pedagogica"
   Plano de Ação Pedagógica geral. Metas para o semestre/ano.
   FOCO: coordenar o trabalho pedagógico com metas claras.
   ENTREGA: metas SMART, ações, responsáveis, prazos, indicadores.

5. tipo_acao = "indicadores"
   Análise de Indicadores Educacionais. IDEB, SAEB, SAEPI, avaliações internas.
   FOCO: transformar dados em decisões pedagógicas.
   ENTREGA: leitura dos dados, hipóteses explicativas, plano de ação baseado em evidências.

6. tipo_acao = "reuniao"
   Reunião / Conselho de Classe.
   FOCO: alinhar equipe ou famílias em torno da aprendizagem.
   ENTREGA: pauta, objetivos, dinâmica, encaminhamentos, ata-resumo.

DADOS QUE VOCÊ RECEBE:
- título, tipo_acao, público-alvo, período, objetivo pedagógico
- dados informados (nunca invente estatísticas)

PRINCÍPIOS QUE ORIENTAM TODA AÇÃO:

1. BASE EM EVIDÊNCIAS
   Toda ação parte de um diagnóstico real. Se houver dados, use-os. Se não houver, diga o que precisa ser levantado.

2. FOCO EM APRENDIZAGEM
   Toda ação do coordenador existe para melhorar a aprendizagem do aluno. Sempre explicite essa conexão.

3. FORMAÇÃO SIGNIFICATIVA
   Professor aprende como aluno aprende: com prática, feedback, espaço para refletir, conexão com a realidade da sala.

4. ACOMPANHAMENTO FORMATIVO
   Devolutiva não é julgamento; é parceria. Use linguagem descritiva, focada em evidências observadas e possibilidades.

5. USO DE DADOS
   Transformar número em ação. Comparar períodos. Focar em descritores de baixo desempenho. Nunca usar dado para punir.

6. REPLICABILIDADE
   Toda ação deve ser viável na realidade da escola pública brasileira: tempo, recursos, pessoal.

O QUE PRIORIZAR NA SAÍDA:

- CABEÇALHO: título, tipo de ação (nome legível), público-alvo, período, objetivo.
- CONTEXTO: diagnóstico breve que fundamenta (nunca invente dados).
- OBJETIVOS: geral + específicos.
- AÇÕES: lista detalhada de ações concretas, cada uma com título, descrição, responsável, prazo, recursos, como avaliar.
- CRONOGRAMA: quando cada ação acontece.
- AVALIAÇÃO: instrumentos, indicadores, como registrar evidências.
- CONSIDERAÇÕES FINAIS: orientações práticas.
- REFERÊNCIAS: documentos citados.

O QUE NÃO FAZER:
- Não invente dados de avaliação.
- Não faça afirmações genéricas ("melhorar a qualidade do ensino") sem ação concreta.
- Não use estereótipos regionais.
- Não trate o professor como executor passivo — ele é parceiro.
- Não entregue relatório teórico; entregue plano executável.

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

    # ============================================================
    # REGRAS DE FORMATAÇÃO DE FÓRMULAS (para tarefas de Materiais)
    # ============================================================
    if task_type in ("simulado", "atividade_imprimivel", "jogo_dinamica"):
        instrucoes_gerais += (
            "═══════════════════════════════════════════════════════════════\n"
            "REGRAS DE FORMATAÇÃO DE FÓRMULAS (OBRIGATÓRIO PARA EXATAS)\n"
            "═══════════════════════════════════════════════════════════════\n"
            "Quando a disciplina for Matemática, Física, Química, Biologia ou quando "
            "o conteúdo envolver cálculos, equações, reações ou fórmulas:\n\n"
            "- Use LaTeX para formatar TODAS as fórmulas:\n"
            "  * Inline (no meio do texto): $...$   → Ex: 'A água é $H_2O$'\n"
            "  * Bloco (destacada): $$...$$   → Ex: 'A equação é $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$'\n\n"
            "- SEMPRE inclua questões com APLICAÇÃO DE FÓRMULAS e CÁLCULOS reais, "
            "não apenas questões teóricas ou conceituais.\n\n"
            "- Exemplos de comandos LaTeX úteis:\n"
            "  * Potências: $x^2$, $10^{-3}$, $a^n$\n"
            "  * Frações: $\\frac{a}{b}$, $\\frac{x+1}{x-2}$\n"
            "  * Raízes: $\\sqrt{x}$, $\\sqrt[3]{x}$\n"
            "  * Somatório: $\\sum_{i=1}^{n} i$\n"
            "  * Integral: $\\int_a^b f(x) \\, dx$\n"
            "  * Química: $H_2SO_4$, $CO_2$, $Fe^{3+}$, $2H_2 + O_2 \\rightarrow 2H_2O$\n"
            "  * Física: $F = m \\cdot a$, $E = mc^2$, $v = \\frac{d}{t}$\n"
            "  * Matemática: $\\Delta = b^2 - 4ac$, $\\sen(x)$, $\\cos(x)$, $\\log(x)$\n\n"
            "- IMPORTANTE: use barras duplas \\\\ ao invés de uma barra \\ dentro das strings JSON, "
            "para que o LaTeX seja corretamente interpretado pelo frontend.\n"
            "  Ex: escreva '\\frac{a}{b}' como '\\\\frac{a}{b}' no JSON.\n\n"
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

    def __init__(self, api_key: Optional[str] = None, chave_propria: bool = False):
        """
        Args:
            api_key: chave do Gemini a ser usada. Se None, usa GEMINI_API_KEY do ambiente.
            chave_propria: True quando a chave é do usuário (não do sistema).
                           Usado apenas para logging e métricas.
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada no .env nem fornecida.")

        self.chave_propria = chave_propria
        self.client = genai.Client(api_key=self.api_key)
        self.controle = ControleDeUso()

    # --------------------------------------------------------
    # CONSTRUÇÃO DO ÍNDICE RAG (chamada no startup)
    # --------------------------------------------------------
    def construir_indice_agora(self):
        """Constrói o índice RAG (compartilhado entre TODAS as instâncias)."""
        global _RAG_INDEX_COMPARTILHADO, _RAG_CONSTRUIDO_COMPARTILHADO
        if _RAG_CONSTRUIDO_COMPARTILHADO:
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
                _RAG_INDEX_COMPARTILHADO.append((item["texto"], result.embeddings[0].values))
            except Exception as e:
                print(f"[RAG] Erro ao gerar embedding: {e}")
        _RAG_CONSTRUIDO_COMPARTILHADO = True
        duracao = time.time() - inicio
        print(f"[RAG] Índice construído com {len(_RAG_INDEX_COMPARTILHADO)} itens em {duracao:.1f}s")

    def _construir_indice(self):
        if _RAG_CONSTRUIDO_COMPARTILHADO:
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
            texto = texto.strip()
            texto = texto.rstrip()
            while texto and texto[-1] in (",", ":"):
                texto = texto[:-1].rstrip()

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
            if not _RAG_INDEX_COMPARTILHADO:
                return ""
            result = self.client.models.embed_content(
                model=MODELO_EMBEDDINGS,
                contents=consulta,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
            )
            consulta_emb = result.embeddings[0].values
            scored = [
                (self._cosine_similarity(consulta_emb, emb), texto)
                for texto, emb in _RAG_INDEX_COMPARTILHADO
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
            # Só busca RAG se houver conteúdo não-vazio. Para modos como
            # `coordenacao`, o payload pode não ter `content` nem `tema`,
            # e o EmbedContentRequest falha com "empty Part".
            if conteudo and conteudo.strip():
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

                try:
                    resultado = json.loads(texto)
                    print(f"[Gemini] Sucesso: {modelo}")
                    return resultado
                except json.JSONDecodeError:
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
    # GERAÇÃO ESTRUTURADA EM LOTES (para o Modo Planejamento)
    # --------------------------------------------------------
    def _system_para_task_com_lote(
        self,
        task_type: str,
        batch_start: int,
        batch_end: int,
        total_aulas: int,
    ) -> str:
        """
        Retorna o system prompt do task_type acrescido da instrução
        de LOTE. Só usado pelo task_type 'planejamento'.
        """
        system_prompt = _system_para_task(task_type, diferenciado=False)
        instrucao = (
            f"\n\n═══════════════════════════════════════════════════════════════\n"
            f"INSTRUÇÃO DE LOTE (CRÍTICA)\n"
            f"═══════════════════════════════════════════════════════════════\n"
            f"Você está gerando um planejamento LONGO em LOTES.\n"
            f"Este é o lote {batch_start}–{batch_end} de um total de {total_aulas} aulas.\n\n"
            f"REGRAS:\n"
            f"1. Retorne o MESMO formato JSON completo do schema (cabecalho, objetivos_gerais, "
            f"objetivos_especificos, habilidades, justificativa, sequencia_didatica, avaliacao_geral, "
            f"adaptacoes_inclusivas, consideracoes_finais, referencias).\n"
            f"2. No campo `sequencia_didatica`, retorne APENAS as aulas {batch_start} a {batch_end}.\n"
            f"3. Cada aula em `sequencia_didatica` deve ter `numero_aula` ABSOLUTO "
            f"(de {batch_start} a {batch_end}), não relativo ao lote.\n"
            f"4. Os campos de cabeçalho, objetivos, justificativa e referências devem ser os MESMOS "
            f"em todos os lotes (para manter consistência quando o frontend concatenar).\n"
            f"5. Mantenha a progressão cognitiva considerando o planejamento COMPLETO "
            f"(as aulas anteriores já foram geradas nos lotes {1}–{batch_start - 1}).\n"
            f"6. Retorne APENAS o JSON, sem texto adicional.\n"
        )
        return system_prompt + instrucao

    def generate_structured_batch(
        self,
        task_type: str,
        payload: Dict[str, Any],
        batch_start: int,
        batch_end: int,
        total_aulas: int,
        diferenciado: bool = False,
    ) -> Dict[str, Any]:
        """
        Geração estruturada em LOTES. Só implementado para 'planejamento'.

        Retorna o JSON parcial com `sequencia_didatica` contendo apenas
        as aulas do lote [batch_start, batch_end].
        """
        if not self.controle.pode_usar():
            return {"erro": self.controle.mensagem_limite()}

        if task_type != "planejamento":
            return {"erro": f"Batching não suportado para task_type: {task_type}"}

        system_prompt = self._system_para_task_com_lote(
            task_type, batch_start, batch_end, total_aulas
        )

        # RAG — só se houver conteúdo não-vazio
        conteudo = payload.get("content") or payload.get("tema") or ""
        if conteudo and conteudo.strip():
            conhecimento = self._buscar_conhecimento(conteudo)
            if conhecimento:
                system_prompt += f"\n\n=== CONHECIMENTO PEDAGÓGICO RELEVANTE ===\n{conhecimento}"

        prompt = (
            f"Dados da solicitação:\n{json.dumps(payload, ensure_ascii=False, indent=2)}\n\n"
            f"Gere o JSON parcial conforme a instrução de lote."
        )

        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini] Structured BATCH ({task_type} {batch_start}-{batch_end}/{total_aulas}) — tentando: {modelo}")
                response = self._executar_com_retry(
                    self.client.models.generate_content,
                    model=modelo,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.5,
                        max_output_tokens=16384,
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

                try:
                    resultado = json.loads(texto)
                    print(f"[Gemini] BATCH Sucesso: {modelo}")
                    return resultado
                except json.JSONDecodeError:
                    resultado = self._reparar_json(texto)
                    if resultado is not None:
                        print(f"[Gemini] BATCH Sucesso (JSON reparado): {modelo}")
                        return resultado
                    raise
            except json.JSONDecodeError as e:
                print(f"[Gemini] BATCH JSON inválido com {modelo}: {e}")
                ultimo_erro = e
                continue
            except Exception as e:
                print(f"[Gemini] BATCH Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        self.controle.registrar_uso()
        return {"erro": f"Todos os modelos falharam no lote {batch_start}-{batch_end}: {ultimo_erro}"}

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

        # Gemini 2.5 Flash Image (codinome "Nano Banana")
        # Modelo principal de geração de imagens — prioridade qualidade.
        MODELO_IMAGEM = "gemini-2.5-flash-image"

        try:
            response = self.client.models.generate_content(
                model=MODELO_IMAGEM,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )
            self.controle.registrar_uso()

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
    # MOTOR 9 — GERAÇÃO DE QUESTÕES EM LOTES (NOVO - NÃO MUDA NADA EXISTENTE)
    # ============================================================
    def _parse_questoes_json(self, texto: str) -> List[Dict[str, Any]]:
        """Parse JSON de questões. Tolerante a vários formatos."""
        texto = texto.strip()

        # Remove marcações markdown
        if texto.startswith("```"):
            partes = texto.split("```")
            for p in partes:
                p = p.strip()
                if p.startswith("json"):
                    p = p[4:].strip()
                if p.startswith("{") or p.startswith("["):
                    texto = p
                    break

        # Tenta parsear direto
        try:
            dados = json.loads(texto)
        except json.JSONDecodeError:
            # Tenta reparar JSON truncado
            dados = self._reparar_json(texto)
            if dados is None:
                # Tenta extrair entre primeiro { e último }
                inicio = texto.find("{")
                fim = texto.rfind("}")
                if inicio != -1 and fim != -1 and fim > inicio:
                    try:
                        dados = json.loads(texto[inicio:fim+1])
                    except json.JSONDecodeError:
                        dados = self._reparar_json(texto[inicio:fim+1])
                if dados is None:
                    raise ValueError("Não foi possível parsear a resposta da IA.")

        # Extrai a lista de questões
        if isinstance(dados, dict) and "questoes" in dados:
            return dados["questoes"]
        if isinstance(dados, list):
            return dados
        raise ValueError("Estrutura de resposta inesperada.")

    def _gerar_lote(
        self,
        prompt_lote: str,
        system_instruction: str,
    ) -> List[Dict[str, Any]]:
        """Gera um lote de questões. Faz fallback entre modelos."""
        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini] Gerando lote com {modelo}...")
                response = self._executar_com_retry(
                    self.client.models.generate_content,
                    model=modelo,
                    contents=prompt_lote,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.6,
                        max_output_tokens=16384,
                        response_mime_type="application/json",
                        thinking_config=_thinking_config(),
                    ),
                )
                self.controle.registrar_uso()
                texto = response.text
                return self._parse_questoes_json(texto)
            except Exception as e:
                print(f"[Gemini] Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        raise Exception(f"Todos os modelos falharam: {ultimo_erro}")

    # ============================================================
    # IA VISION — CLASSIFICAÇÃO DE FIGURAS (BLOCO F - FASE 5)
    # ============================================================
    CATEGORIAS_FIGURA = [
        "quantidade", "ordem", "medida", "decomposicao", "sequencia",
        "comparacao", "objetos_escolares", "formas", "numeros", "nenhuma",
    ]

    async def classify_image(self, image_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """
        Classifica uma imagem pedagógica usando Gemini Vision.

        Recebe os bytes da imagem + mime_type.
        Retorna dict com:
          {
            "nome": "carrinho de brinquedo vermelho",
            "categorias": ["quantidade", "objetos_escolares"],
            "subcategoria": "brinquedos",
            "keywords": ["carrinho", "brinquedo", "veículo", "roda"]
          }
        """
        if not self.controle.pode_usar():
            raise Exception(self.controle.mensagem_limite())

        cats_validas = ", ".join(self.CATEGORIAS_FIGURA)

        system_prompt = (
            "Você é um especialista em educação brasileira e ilustrações pedagógicas. "
            "Analise a imagem enviada e retorne APENAS um JSON com a estrutura:\n"
            "{\n"
            '  "nome": "string (nome curto e descritivo em português, ex: \'carrinho de brinquedo vermelho\')",\n'
            '  "categorias": ["array com 1 a 3 categorias da lista permitida"],\n'
            '  "subcategoria": "string (opcional, ex: frutas, animais, brinquedos, escola)",\n'
            '  "keywords": ["array com 3 a 6 palavras-chave em português para busca"]\n'
            "}\n\n"
            f"CATEGORIAS PERMITIDAS: {cats_validas}\n\n"
            "REGRAS DE CATEGORIZAÇÃO:\n"
            "- quantidade = objetos contáveis (bolas, frutas, lápis, brinquedos)\n"
            "- ordem = posição, fila, pódio, ranking, sequência de posições\n"
            "- medida = régua, relógio, balança, instrumentos de medida\n"
            "- decomposicao = blocos, ábaco, material dourado, valor posicional\n"
            "- sequencia = reta numérica, padrões, ciclos\n"
            "- comparacao = maior/menor, sinais matemáticos, grupos comparados\n"
            "- objetos_escolares = lápis, caderno, tesoura, mochila, livro\n"
            "- formas = formas geométricas (quadrado, círculo, triângulo)\n"
            "- numeros = dígitos ou números\n"
            "- nenhuma = apenas se não se encaixar em nenhuma\n\n"
            "REGRAS IMPORTANTES:\n"
            "- SEMPRE retorne pelo menos 1 categoria.\n"
            "- Se a imagem puder servir a mais de uma categoria, inclua todas (até 3).\n"
            "- O nome deve ser descritivo e curto (máximo 60 caracteres).\n"
            "- As keywords devem ajudar a encontrar a figura por busca textual.\n"
            "- Retorne APENAS o JSON, sem texto antes ou depois."
        )

        # Cria o Part da imagem para o SDK novo
        try:
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        except Exception as e:
            print(f"[Gemini Vision] Erro ao criar Part: {e}")
            raise Exception("Formato de imagem não suportado.")

        ultimo_erro = None
        for modelo in MODELOS_CHAT:
            try:
                print(f"[Gemini Vision] Classificando com {modelo}...")
                response = self._executar_com_retry(
                    self.client.models.generate_content,
                    model=modelo,
                    contents=[image_part, system_prompt],
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=1024,
                        response_mime_type="application/json",
                        thinking_config=_thinking_config(),
                    ),
                )
                self.controle.registrar_uso()
                texto = response.text.strip()

                # Remove marcações markdown
                if texto.startswith("```"):
                    texto = texto.split("```")[1]
                    if texto.startswith("json"):
                        texto = texto[4:]
                texto = texto.strip()

                try:
                    resultado = json.loads(texto)
                except json.JSONDecodeError:
                    resultado = self._reparar_json(texto)
                    if resultado is None:
                        raise

                # Normaliza categorias
                cats = resultado.get("categorias", []) or []
                cats_validas_lista = [c for c in cats if c in self.CATEGORIAS_FIGURA]
                if not cats_validas_lista:
                    cats_validas_lista = ["nenhuma"]

                # Normaliza keywords
                kws = resultado.get("keywords", []) or []
                kws = [str(k).strip() for k in kws if k][:6]

                print(f"[Gemini Vision] Sucesso: {modelo}")
                return {
                    "nome": (resultado.get("nome") or "figura")[:100],
                    "categorias": cats_validas_lista[:3],
                    "subcategoria": resultado.get("subcategoria") or None,
                    "keywords": kws,
                }
            except Exception as e:
                print(f"[Gemini Vision] Falha em {modelo}: {e}")
                ultimo_erro = e
                continue

        raise Exception(f"Todos os modelos falharam: {ultimo_erro}")

    def generate_questions_batch(
        self,
        system_instruction: str,
        base_prompt: str,
        total_questoes: int,
        batch_size: int = 15,
    ) -> List[Dict[str, Any]]:
        """
        Gera questões em LOTES automáticos para evitar truncamento de JSON.

        Args:
            system_instruction: instrução do sistema (o "papel" da IA)
            base_prompt: prompt com todos os dados da prova (sem instrução de lote)
            total_questoes: total de questões a gerar
            batch_size: quantas por lote (default 15)

        Returns:
            Lista consolidada de questões
        """
        todas_questoes: List[Dict[str, Any]] = []
        inicio = 1

        while inicio <= total_questoes:
            fim = min(inicio + batch_size - 1, total_questoes)
            qtd = fim - inicio + 1

            prompt_lote = (
                f"{base_prompt}\n\n"
                f"═══════════════════════════════════════════════════════════════\n"
                f"INSTRUÇÃO DE LOTE (LEIA COM ATENÇÃO)\n"
                f"═══════════════════════════════════════════════════════════════\n"
                f"Você deve gerar EXATAMENTE {qtd} questão(ões) neste lote, "
                f"numeradas de {inicio} a {fim}.\n"
                f"Retorne APENAS o JSON, sem texto adicional.\n"
            )

            questoes_lote = self._gerar_lote(prompt_lote, system_instruction)
            todas_questoes.extend(questoes_lote)
            print(f"[Gemini] Lote {inicio}-{fim}: {len(questoes_lote)} questões geradas")

            inicio = fim + 1

        # Renumera sequencialmente
        for i, q in enumerate(todas_questoes, start=1):
            q["numero"] = i

        return todas_questoes


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


# ============================================================
# MULTI-API KEY — instância por usuário
# ============================================================
def get_gemini_service_for_user(user, db=None) -> GeminiService:
    """
    Retorna uma instância do GeminiService apropriada para o usuário.

    Regras:
      - Se o usuário tem `gemini_api_key` (criptografada) → descriptografa
        e retorna uma instância cacheada com a chave DELE.
      - Se não tem → retorna o singleton global (chave do sistema).

    Args:
        user: instância do modelo User (com atributo `gemini_api_key`)
        db: reservado para uso futuro (métricas de uso por chave)

    Returns:
        GeminiService configurado corretamente
    """
    global _gemini_users_cache

    # Sem usuário ou sem chave → usa singleton do sistema
    if user is None or not getattr(user, "gemini_api_key", None):
        return get_gemini_service()

    user_id = str(user.id)
    token_criptografado = user.gemini_api_key

    # Já existe instância em cache para este usuário com a mesma chave?
    cached = _gemini_users_cache.get(user_id)
    if cached is not None:
        if getattr(cached, "_token_origem", None) == token_criptografado:
            return cached
        # Chave mudou → invalida cache
        _gemini_users_cache.pop(user_id, None)

    # Descriptografa a chave
    api_key_plana = descriptografar(token_criptografado)
    if not api_key_plana:
        print(f"[Gemini] Falha ao descriptografar chave do usuário {user_id}. Usando chave do sistema.")
        return get_gemini_service()

    # Cria nova instância com a chave do usuário
    try:
        instancia = GeminiService(api_key=api_key_plana, chave_propria=True)
        # Guarda o token de origem para detectar troca de chave
        instancia._token_origem = token_criptografado
        _gemini_users_cache[user_id] = instancia
        print(f"[Gemini] Usando chave PRÓPRIA do usuário {user_id}")
        return instancia
    except Exception as e:
        print(f"[Gemini] Erro ao criar instância para usuário {user_id}: {e}. Usando chave do sistema.")
        return get_gemini_service()


def invalidar_cache_usuario(user_id: str):
    """Remove a instância cacheada do usuário (útil quando a chave muda)."""
    _gemini_users_cache.pop(str(user_id), None)