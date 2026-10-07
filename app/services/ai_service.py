import os
from typing import Dict, Any, List
from .inclusion_service import gerar_adaptacoes_inclusivas


class BaseAIService:
    """Interface base para serviços de IA."""

    def generate_structured(
        self,
        task_type: str,
        payload: Dict[str, Any],
        diferenciado: bool = False,
    ) -> Dict[str, Any]:
        raise NotImplementedError

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        direcionamento_estagio: str = None,
        contexto_tema: str = None,
    ) -> str:
        raise NotImplementedError


class MockAIService(BaseAIService):
    """Serviço de IA simulado. Usado APENAS como fallback quando o Gemini NÃO está configurado."""

    def generate_structured(
        self,
        task_type: str,
        payload: Dict[str, Any],
        diferenciado: bool = False,
    ) -> Dict[str, Any]:
        if task_type == "neuroaula":
            return self._mock_neuroaula(payload)
        elif task_type == "aula_que_funciona":
            return self._mock_aula(payload)
        elif task_type == "professor_inteiro":
            return self._mock_reflexao(payload)
        elif task_type == "meu_aluno":
            return self._mock_aluno(payload)
        elif task_type == "atividade_imprimivel":
            return self._mock_atividade(payload, diferenciado)
        elif task_type == "jogo_dinamica":
            return self._mock_jogo(payload, diferenciado)
        elif task_type == "simulado":
            return self._mock_simulado(payload, diferenciado)
        elif task_type == "pratica_exitosa":
            return self._mock_pratica_exitosa(payload)
        else:
            return {"erro": f"Tipo de tarefa não suportado: {task_type}"}

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        direcionamento_estagio: str = None,
        contexto_tema: str = None,
    ) -> str:
        return (
            "Estou aqui para ouvir. Me conta um pouco mais sobre o que você está sentindo."
        )

    # ============================================================
    # NEUROAULA — DESIGN DE APRENDIZAGEM (O "PORQUÊ")
    # ============================================================
    def _mock_neuroaula(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        conteudo = payload.get("content") or "o conteúdo"
        serie = payload.get("grade") or "a série informada"
        disciplina = payload.get("subject") or "a disciplina"
        bncc_codigo = payload.get("bncc_codigo") or ""
        bncc_texto = payload.get("bncc_texto") or ""
        duracao = payload.get("duracao_minutos") or 50
        num_alunos = payload.get("num_alunos") or 25
        dificuldades = payload.get("dificuldades") or ""
        previos = payload.get("conhecimentos_previos") or ""

        cabecalho = {
            "titulo": payload.get("title") or f"Design de Aprendizagem: {conteudo}",
            "ano": serie,
            "disciplina": disciplina,
            "bncc": {"codigo": bncc_codigo, "texto": bncc_texto},
            "objetivo": payload.get("objective") or f"Compreender {conteudo} com base em princípios cognitivos de aprendizagem significativa.",
            "duracao": f"{duracao} minutos",
            "num_alunos": num_alunos,
            "abordagem": "Design de aprendizagem com base em neuroeducação",
        }

        principios = [
            {
                "nome": "Atenção Seletiva",
                "explicacao": "O cérebro só aprende o que considera relevante. Iniciar com novidade (objeto inusitado, pergunta intrigante) ativa o sistema de alerta e faz a turma engatar no conteúdo.",
                "aplicacao": f"Nas primeiras 2 minutos, apresente {conteudo} através de uma situação inesperada ou pergunta que cause surpresa.",
            },
            {
                "nome": "Conhecimentos Prévios",
                "explicacao": "Aprendizagem significativa só acontece quando o novo se conecta ao que o aluno já sabe. Sem essa ponte, a informação vira conteúdo decorado e esquecido.",
                "aplicacao": f"Antes de explicar {conteudo}, mapeie com a turma o que eles já sabem. Use 'O que vocês já ouviram sobre...?'.",
            },
            {
                "nome": "Carga Cognitiva",
                "explicacao": "A memória de trabalho só processa 3 a 4 elementos simultâneos. Explicações longas e com muitos elementos competem entre si e nada fica retido.",
                "aplicacao": f"Divida {conteudo} em blocos pequenos. Ensine UMA ideia por vez. Use pausas para consolidação.",
            },
            {
                "nome": "Dupla Codificação",
                "explicacao": "Combinar informação verbal com informação visual cria duas rotas de memória. A retenção aumenta significativamente quando o aluno vê e ouve ao mesmo tempo.",
                "aplicacao": f"Ao explicar {conteudo}, sempre acompanhe com um esquema visual na lousa ou uma imagem.",
            },
            {
                "nome": "Recuperação Ativa",
                "explicacao": "O cérebro retém melhor o que ele precisa buscar ativamente na memória. Pedir que o aluno explique é muito mais eficaz do que ele apenas ouvir de novo.",
                "aplicacao": f"Durante a aula, peça que os alunos expliquem {conteudo} com as próprias palavras para o colega ao lado.",
            },
            {
                "nome": "Transferência",
                "explicacao": "O aprendizado se consolida quando o aluno aplica o conceito em situação nova. Repetir o exemplo dado pelo professor não gera aprendizagem duradoura.",
                "aplicacao": f"Ao final, apresente uma situação nova do cotidiano que exija {conteudo}.",
            },
        ]

        etapas = [
            {
                "numero": 1,
                "titulo": "Abertura com Novidade",
                "tempo": "5 min",
                "professor_faca": "Coloque 3 objetos diferentes sobre a mesa da frente. Fique em silêncio por 5 segundos olhando para os objetos, sem dizer nada.",
                "diga": f"Hoje nós vamos descobrir algo muito interessante sobre {conteudo}. Mas antes, quero que vocês observem esses objetos.",
                "pergunte": "O que vocês acham que esses objetos têm a ver com o que vamos aprender?",
                "alunos_deverao": "Observar em silêncio, depois levantar a mão para arriscar hipóteses.",
                "porque_funciona": "A novidade ativa a atenção seletiva e prepara o cérebro para receber informação nova. O silêncio cria expectativa.",
                "principio_relacionado": "Atenção Seletiva",
            },
            {
                "numero": 2,
                "titulo": "Resgate de Conhecimentos Prévios",
                "tempo": "7 min",
                "professor_faca": "Divida a lousa em duas colunas: 'O que já sei' e 'O que quero saber'. Registre o que os alunos falarem.",
                "diga": "Antes de avançar, quero ouvir vocês. O que já sabem sobre isso? Não existe resposta errada.",
                "pergunte": f"Onde vocês já viram {conteudo} na vida de vocês? Como foi?",
                "alunos_deverao": "Compartilhar experiências e formular perguntas que serão registradas.",
                "porque_funciona": "Aprendizagem significativa só ocorre quando o novo conteúdo se ancora no que o aluno já sabe. Mapear o que existe na cabeça deles é o primeiro passo.",
                "principio_relacionado": "Conhecimentos Prévios",
            },
            {
                "numero": 3,
                "titulo": "Explicação Segmentada",
                "tempo": "10 min",
                "professor_faca": f"Escreva na lousa UMA única ideia central sobre {conteudo}, acompanhada de um esquema visual simples. Fale devagar. Pause. Repita 2 vezes.",
                "diga": f"Vou mostrar {conteudo} com uma ideia só. Prestem atenção nessa ideia. [escreva ou desenhe]. Agora repito: [repita].",
                "pergunte": "Faz sentido até aqui? Quem pode repetir com as próprias palavras?",
                "alunos_deverao": "Ouvir, observar o esquema visual na lousa, repetir a ideia central para o colega ao lado.",
                "porque_funciona": "A memória de trabalho satura rápido. Ao apresentar uma ideia por vez, com apoio visual, o aluno consegue processar sem sobrecarga. A repetição consolida.",
                "principio_relacionado": "Carga Cognitiva + Dupla Codificação",
            },
            {
                "numero": 4,
                "titulo": "Prática com Recuperação Ativa",
                "tempo": "15 min",
                "professor_faca": f"Organize duplas. Entregue 5 cartões numerados por dupla. Escreva na lousa uma tarefa curta envolvendo {conteudo}.",
                "diga": "Agora é a vez de vocês. Em duplas, um explica para o outro. Quero ouvir o raciocínio, não só a resposta.",
                "pergunte": "Como vocês chegaram nessa resposta? Expliquem o caminho.",
                "alunos_deverao": "Resolver juntos, manipular os cartões, explicar o raciocínio um para o outro, registrar no caderno.",
                "porque_funciona": "Recuperar ativamente é mais eficaz do que reler. Explicar para o colega exige reorganizar o pensamento — o que consolida a memória de longo prazo.",
                "principio_relacionado": "Recuperação Ativa",
            },
            {
                "numero": 5,
                "titulo": "Transferência para Situação Nova",
                "tempo": "8 min",
                "professor_faca": f"Apresente uma situação nova, do cotidiano dos alunos, que exija aplicar {conteudo}. Peça resolução individual por 3 minutos.",
                "diga": "Agora um desafio novo. Imaginem que vocês estão [situação]. Como resolveriam usando o que aprenderam hoje?",
                "pergunte": "Quem quer contar como pensou?",
                "alunos_deverao": "Resolver individualmente, depois compartilhar com a turma.",
                "porque_funciona": "A transferência é o teste final da aprendizagem. Se o aluno só repete o exemplo dado, não aprendeu — decorou.",
                "principio_relacionado": "Transferência",
            },
            {
                "numero": 6,
                "titulo": "Fechamento Metacognitivo",
                "tempo": "5 min",
                "professor_faca": "Retome o esquema da lousa. Peça que cada aluno escreva em uma folha 'uma coisa que aprendi hoje' e entregue na saída.",
                "diga": "Antes de terminar: o que vocês levam de mais importante dessa aula?",
                "pergunte": f"Alguém ainda tem dúvida sobre {conteudo}?",
                "alunos_deverao": "Responder oralmente, registrar 1 aprendizado no papel, entregar ao professor na saída.",
                "porque_funciona": "Refletir sobre o que aprendeu ativa a metacognição — o aluno se torna consciente do próprio processo de aprendizagem, o que aumenta a retenção futura.",
                "principio_relacionado": "Consolidação e Metacognição",
            },
        ]

        para_o_professor = {
            "por_que_esta_aula_funciona": (
                f"Esta aula de {conteudo} foi desenhada em 6 etapas. Cada etapa ativa um princípio "
                "cognitivo específico: começa ativando atenção (novidade), ancora no que o aluno já sabe "
                "(conhecimentos prévios), controla a carga (uma ideia por vez), força recuperação ativa "
                "(explicar para o colega), testa transferência (situação nova) e fecha com metacognição. "
                "Não é uma sequência aleatória — é uma arquitetura de aprendizagem."
            ),
            "o_que_voce_vai_desenvolver": [
                "Capacidade de desenhar aulas com base em princípios cognitivos",
                "Repertório de estratégias para ativar atenção e memória",
                "Domínio do ritmo certo para cada etapa",
                "Observação do comportamento dos alunos como feedback pedagógico",
            ],
            "reflexao_apos_a_aula": [
                "Qual etapa gerou mais engajamento? Por quê?",
                "Em qual momento os alunos travaram? O que isso revela?",
                "O que você faria diferente na próxima vez?",
                "Qual princípio desses você quer internalizar para outras aulas?",
            ],
            "se_alunos_dificuldade": (
                f"Se a turma não compreender {conteudo} na Etapa 3, retome com um exemplo mais concreto "
                "antes de avançar. Não aumente o volume da explicação — aumente a concretude. "
                "Use objetos físicos e peça que expliquem de volta para você."
            ),
        }

        return {
            "cabecalho": cabecalho,
            "principios_cognitivos": principios,
            "etapas": etapas,
            "para_o_professor": para_o_professor,
            "inclusao": gerar_adaptacoes_inclusivas(dificuldades),
        }

    # ============================================================
    # AULA QUE FUNCIONA — SCRIPT DE EXECUÇÃO (O "COMO")
    # ============================================================
    def _mock_aula(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        conteudo = payload.get("content") or "o conteúdo"
        serie = payload.get("grade") or "a série informada"
        disciplina = payload.get("subject") or "a disciplina"
        bncc_codigo = payload.get("bncc_codigo") or ""
        bncc_texto = payload.get("bncc_texto") or ""
        duracao = payload.get("duracao_minutos") or 50
        num_alunos = payload.get("num_alunos") or 25
        dificuldades = payload.get("dificuldades") or ""

        cabecalho = {
            "titulo": payload.get("title") or f"Aula: {conteudo}",
            "ano": serie,
            "disciplina": disciplina,
            "bncc": {"codigo": bncc_codigo, "texto": bncc_texto},
            "objetivo": payload.get("objective") or f"Compreender e aplicar {conteudo}.",
            "duracao": f"{duracao} minutos",
            "num_alunos": num_alunos,
        }

        checklist = [
            "Lousa limpa e giz/pincel à mão",
            "Folha de atividade impressa (1 por aluno)",
            "Cartões numerados de 1 a 5 (1 conjunto por dupla)",
            "Ficha de observação do professor (opcional)",
            "Cronômetro ou relógio visível",
        ]

        roteiro = [
            {"tempo": "0-5 min", "titulo": "Abertura", "faca": f"Escreva na lousa a pergunta: 'O que é {conteudo}?'", "fale": "Vou fazer uma pergunta e quero ouvir o que vocês pensam.", "pergunte": "Quem arrisca uma resposta?", "alunos": "Levantar a mão e compartilhar hipóteses."},
            {"tempo": "5-15 min", "titulo": "Explicação Curta", "faca": f"Explique {conteudo} em até 3 ideias. Escreva cada ideia no quadro.", "fale": f"Vou explicar {conteudo} de três formas.", "pergunte": "Qual dessas três ficou mais clara?", "alunos": "Ouvir, anotar uma ideia principal."},
            {"tempo": "15-35 min", "titulo": "Atividade Principal", "faca": f"Entregue a atividade. Organize duplas.", "fale": "Agora vocês resolvem juntos.", "pergunte": "Como vocês chegaram nessa resposta?", "alunos": "Resolver em dupla, registrar no caderno."},
            {"tempo": "35-43 min", "titulo": "Socialização", "faca": "Escolha 2 duplas para apresentar.", "fale": "Quem quer vir contar como resolveu?", "pergunte": "Alguém resolveu de um jeito diferente?", "alunos": "Apresentar, ouvir os colegas."},
            {"tempo": "43-50 min", "titulo": "Fechamento", "faca": "Retome as 3 ideias-chave no quadro.", "fale": f"O que vocês aprenderam hoje sobre {conteudo}?", "pergunte": "Alguém ainda tem dúvida?", "alunos": "Responder oralmente e escrever 1 frase no caderno."},
        ]

        adaptacoes = [
            "Alunos com dificuldade: entregue versão simplificada da atividade.",
            "Alunos avançados: proponha variação mais complexa.",
            "Alunos dispersos: atribua função específica na dupla.",
        ]

        return {
            "cabecalho": cabecalho,
            "checklist": checklist,
            "roteiro": roteiro,
            "adaptacoes": adaptacoes,
            "inclusao": gerar_adaptacoes_inclusivas(dificuldades),
            "intervencao": (
                f"Se ao final da aula a turma não demonstrou compreensão de {conteudo}, "
                "retome na próxima com abordagem diferente."
            ),
        }

    # ============================================================
    # PROFESSOR POR INTEIRO (placeholder)
    # ============================================================
    def _mock_reflexao(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "pergunta_aprofundamento": "O que essa situação revela sobre o que você valoriza como professor?",
            "sugestao_acao": "Escolha uma pequena ação para a próxima aula e observe o resultado.",
            "perspectiva": "Toda dificuldade pedagógica é uma oportunidade de ajustar a prática.",
        }

    # ============================================================
    # MEU ALUNO (placeholder)
    # ============================================================
    def _mock_aluno(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "resumo": "Aluno apresenta dificuldades pontuais em leitura e compreensão.",
            "hipoteses_pedagogicas": [
                "Possível lacuna em pré-requisitos de leitura",
                "Baixa familiaridade com o vocabulário do conteúdo",
                "Falta de estratégias de estudo",
            ],
            "sugestoes_intervencao": [
                "Leitura compartilhada com apoio visual",
                "Vocabulário-chave em cartaz na sala",
                "Atividade em dupla com colega mais experiente",
            ],
        }

    # ============================================================
    # MATERIAIS — ATIVIDADE IMPRIMÍVEL
    # ============================================================
    def _mock_atividade(self, payload: Dict[str, Any], diferenciado: bool) -> Dict[str, Any]:
        conteudo = payload.get("content") or "o conteúdo"
        dificuldades = payload.get("dificuldades") or ""

        cabecalho = {
            "titulo": payload.get("title") or f"Atividade de {conteudo}",
            "ano": payload.get("grade") or "",
            "disciplina": payload.get("subject") or "",
            "bncc": {"codigo": payload.get("bncc_codigo") or "", "texto": payload.get("bncc_texto") or ""},
            "objetivo": payload.get("objective") or f"Praticar {conteudo}.",
        }

        versao_principal = {
            "instrucoes_gerais": "Leia cada questão com atenção e responda de forma completa.",
            "atividades": [
                {"numero": i + 1, "tipo": "dissertativa", "enunciado": f"Questão {i+1}: Explique com suas palavras o que você entendeu sobre {conteudo}.", "alternativas": [], "espaco_resposta": "medio", "gabarito": "Resposta pessoal esperada."}
                for i in range(3)
            ],
            "gabarito_professor": [f"{i+1} - Resposta esperada sobre {conteudo}." for i in range(3)],
        }

        resultado = {"cabecalho": cabecalho}

        if diferenciado:
            versao_adaptada = {
                "instrucoes_gerais": "Versão simplificada. Leia com calma. Se precisar, peça ajuda ao seu colega ou ao professor.",
                "atividades": [
                    {"numero": i + 1, "tipo": "completar", "enunciado": f"{conteudo}: ______", "alternativas": [], "apoio_visual": "Imagem de apoio", "gabarito": "Resposta simples"}
                    for i in range(2)
                ],
                "gabarito_professor": [f"{i+1} - Resposta simplificada." for i in range(2)],
            }
            resultado["versao_principal"] = versao_principal
            resultado["versao_adaptada"] = versao_adaptada
        else:
            resultado["cabecalho"]["instrucoes_gerais"] = versao_principal["instrucoes_gerais"]
            resultado["atividades"] = versao_principal["atividades"]
            resultado["gabarito_professor"] = versao_principal["gabarito_professor"]

        resultado["inclusao"] = gerar_adaptacoes_inclusivas(dificuldades)
        return resultado

    # ============================================================
    # MATERIAIS — JOGO / DINÂMICA
    # ============================================================
    def _mock_jogo(self, payload: Dict[str, Any], diferenciado: bool) -> Dict[str, Any]:
        conteudo = payload.get("content") or "o conteúdo"
        dificuldades = payload.get("dificuldades") or ""

        cabecalho = {
            "titulo": payload.get("title") or f"Jogo de {conteudo}",
            "ano": payload.get("grade") or "",
            "disciplina": payload.get("subject") or "",
            "duracao": f"{payload.get('duracao_minutos') or 30} min",
            "num_participantes": "Toda a turma",
            "objetivo": f"Trabalhar {conteudo} de forma lúdica",
        }

        versao_principal = {
            "como_jogar": [
                {"passo": 1, "descricao": f"Divida a turma em grupos de 4 a 5 alunos."},
                {"passo": 2, "descricao": f"Distribua os cartões com desafios sobre {conteudo}."},
                {"passo": 3, "descricao": "Cada grupo responde. Quem acertar ganha pontos."},
            ],
            "regras": [
                "Cada grupo tem 1 minuto para responder.",
                "Não é permitido consultar o caderno.",
                "Todos devem participar.",
            ],
            "variacoes": ["Jogar em duplas para turmas menores", "Usar perguntas mais desafiadoras para turmas avançadas"],
        }

        resultado = {
            "cabecalho": cabecalho,
            "materiais": ["Cartões com perguntas", "Lousa", "Cronômetro", "Fichas coloridas"],
            "dicas_professor": [
                "Circule pela sala para garantir que todos participem.",
                "Anote as dificuldades observadas para retomar depois.",
                "Elogie o esforço, não apenas o acerto.",
            ],
        }

        if diferenciado:
            resultado["versao_principal"] = versao_principal
            resultado["versao_adaptada"] = {
                "adaptacoes": ["Instruções simplificadas em cartão visual", "Possibilidade de participação parcial", "Tempo estendido"],
                "como_jogar_adaptado": [
                    {"passo": 1, "descricao": "Formar grupos pequenos."},
                    {"passo": 2, "descricao": "Cada aluno responde UMA pergunta por vez."},
                ],
                "regras_adaptadas": ["Tempo maior", "Pode usar apoio visual", "Colega pode ajudar"],
                "papel_do_colega_apoio": "O colega ao lado ajuda com leitura e compreensão das instruções.",
            }
        else:
            resultado.update(versao_principal)

        resultado["inclusao"] = gerar_adaptacoes_inclusivas(dificuldades)
        return resultado

    # ============================================================
    # MATERIAIS — SIMULADO
    # ============================================================
    def _mock_simulado(self, payload: Dict[str, Any], diferenciado: bool) -> Dict[str, Any]:
        conteudo = payload.get("content") or "o conteúdo"
        dificuldades = payload.get("dificuldades") or ""
        num_q = payload.get("num_questoes") or 5

        cabecalho = {
            "titulo": payload.get("title") or f"Simulado de {conteudo}",
            "ano": payload.get("grade") or "",
            "disciplina": payload.get("subject") or "",
            "tema": conteudo,
            "num_questoes": num_q,
            "instrucoes": "Leia com atenção cada questão. Para múltipla escolha, marque apenas uma resposta.",
        }

        versao_principal = {
            "num_questoes": num_q,
            "questoes": [
                {
                    "numero": i + 1,
                    "tipo": "multipla_escolha",
                    "enunciado": f"Questão {i+1} sobre {conteudo}?",
                    "alternativas": [f"A) Alternativa A", f"B) Alternativa B", f"C) Alternativa C", f"D) Alternativa D"],
                    "resposta_correta": "A) Alternativa A",
                    "explicacao": "Justificativa da resposta correta.",
                }
                for i in range(num_q)
            ],
            "gabarito": [f"{i+1} - A" for i in range(num_q)],
        }

        resultado = {"cabecalho": cabecalho}

        if diferenciado:
            versao_adaptada = {
                "num_questoes": max(2, num_q - 2),
                "instrucoes": "Versão simplificada. Leia com calma.",
                "questoes": [
                    {
                        "numero": i + 1,
                        "tipo": "verdadeiro_falso",
                        "enunciado": f"({i+1}) Sobre {conteudo}: esta afirmação é verdadeira?",
                        "alternativas": ["( ) Verdadeiro", "( ) Falso"],
                        "apoio_visual": "Ícone visual de apoio",
                        "resposta_correta": "Verdadeiro",
                        "explicacao": "Explicação simplificada.",
                    }
                    for i in range(max(2, num_q - 2))
                ],
                "gabarito": [f"{i+1} - V" for i in range(max(2, num_q - 2))],
            }
            resultado["versao_principal"] = versao_principal
            resultado["versao_adaptada"] = versao_adaptada
        else:
            resultado.update(versao_principal)

        resultado["inclusao"] = gerar_adaptacoes_inclusivas(dificuldades)
        return resultado

    # ============================================================
    # PRÁTICAS EXITOSAS
    # ============================================================
    def _mock_pratica_exitosa(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Mock de Práticas Exitosas. Retorna estrutura de exemplo."""
        return {
            "cabecalho": {
                "titulo": payload.get("title") or "Prática Pedagógica Exitosa",
                "subtitulo": "Uma experiência que transforma a aprendizagem",
                "perfil": payload.get("perfil") or "professor",
                "fluxo": payload.get("flow_type") or "criar",
                "categoria": payload.get("category") or "ciclo_alfabetizacao",
                "escola": payload.get("school") or "",
                "municipio": payload.get("city") or "",
                "gre": payload.get("gre") or "",
                "serie_ou_etapa": payload.get("grade") or "",
                "disciplina_ou_area": payload.get("subject") or "",
                "duracao": payload.get("duration") or "A definir",
                "num_alunos": payload.get("num_alunos") or 0,
            },
            "resumo_executivo": "Prática em construção. Conteúdo completo será gerado pela IA real.",
            "justificativa": "Torna a aprendizagem mais significativa, contextualizada e inclusiva.",
            "objetivos": {
                "geral": "Promover aprendizagem significativa e engajadora.",
                "especificos": [
                    "Desenvolver habilidades previstas na BNCC para a etapa.",
                    "Garantir a participação de todos os alunos, com ou sem laudo.",
                ],
            },
            "metodologia": {
                "descricao_geral": "Organizada em etapas sequenciais com metodologias ativas.",
                "etapas": [
                    {
                        "numero": 1,
                        "titulo": "Diagnóstico inicial",
                        "duracao": "1 semana",
                        "descricao": "Levantamento dos conhecimentos prévios.",
                        "acao_do_educador": "Aplicar sondagem diagnóstica e registrar hipóteses.",
                        "acao_dos_estudantes": "Participar das atividades diagnósticas.",
                        "recursos_necessarios": ["Folha de sondagem", "Lápis"],
                        "como_avaliar": "Observação e registro pedagógico.",
                    },
                    {
                        "numero": 2,
                        "titulo": "Desenvolvimento",
                        "duracao": "8 semanas",
                        "descricao": "Execução das atividades sequenciais.",
                        "acao_do_educador": "Mediar as atividades e acompanhar cada aluno.",
                        "acao_dos_estudantes": "Realizar as atividades em duplas e grupos.",
                        "recursos_necessarios": ["Material impresso", "Recursos visuais"],
                        "como_avaliar": "Produções dos alunos e observação contínua.",
                    },
                ],
            },
            "cronograma": [
                {"periodo": "1º bimestre", "foco": "Diagnóstico", "atividades_principais": ["Sondagem inicial"]},
                {"periodo": "2º bimestre", "foco": "Desenvolvimento", "atividades_principais": ["Atividades sequenciais"]},
                {"periodo": "3º bimestre", "foco": "Consolidação", "atividades_principais": ["Avaliação processual"]},
                {"periodo": "4º bimestre", "foco": "Culminância", "atividades_principais": ["Mostra de resultados"]},
            ],
            "adaptacoes_inclusivas": (
                [
                    {
                        "necessidade": "Aluno com TDAH",
                        "estrategias": [
                            "Dividir as atividades em blocos curtos de 5 a 7 minutos.",
                            "Usar checkpoints visuais para marcar progresso.",
                        ],
                    }
                ]
                if payload.get("has_special_needs")
                else []
            ),
            "avaliacao": {
                "instrumentos": ["Observação contínua", "Produções dos alunos"],
                "indicadores_de_sucesso": ["Participação ativa", "Evolução na aprendizagem"],
                "como_registrar_evidencias": ["Fotos das atividades", "Portfólio dos alunos"],
            },
            "resultados_esperados": ["Melhoria na aprendizagem", "Maior engajamento dos alunos"],
            "dicas_de_aprimoramento": ["Documente cada etapa", "Compartilhe com colegas"],
            "referencias_regionais": ["Práticas do PPAIC voltadas à alfabetização na idade certa."],
            "imagens_sugeridas": [
                {"secao": "capa", "prompt_imagem": "Brazilian teachers and students collaborating in a classroom, vibrant colors, storybook style"}
            ],
        }
    
class AIService(BaseAIService):
    """
    Serviço principal de IA.
    Usa o Gemini real. Se o Gemini estiver configurado mas FALHAR, retorna ERRO CLARO
    (não cai silenciosamente no Mock). O Mock só é usado se a chave NÃO estiver configurada.
    """

    def __init__(self):
        self._gemini = None
        self._mock = MockAIService()
        self._erro_gemini = None

        try:
            from .gemini_service import GeminiService
            if os.getenv("GEMINI_API_KEY"):
                self._gemini = GeminiService()
                print("[AIService] Gemini ativado — usando IA real.")
            else:
                print("[AIService] GEMINI_API_KEY não configurada — usando Mock.")
        except Exception as e:
            self._erro_gemini = str(e)
            print(f"[AIService] Falha ao inicializar Gemini ({e}) — usando Mock.")

    def generate_structured(
        self,
        task_type: str,
        payload: Dict[str, Any],
        diferenciado: bool = False,
        user=None,
    ) -> Dict[str, Any]:
        dificuldades = payload.get("dificuldades") or ""
        inclusao = gerar_adaptacoes_inclusivas(dificuldades)

        # Multi-API key: se um usuário foi informado e tem chave própria
        # cadastrada, usa o Gemini DELE. Caso contrário, cai na chave do sistema.
        gemini = self._gemini
        if user is not None:
            try:
                from .gemini_service import get_gemini_service_for_user
                gemini = get_gemini_service_for_user(user)
            except Exception as e:
                print(f"[AIService] Erro ao obter Gemini do usuário: {e}")
                gemini = self._gemini

        if gemini:
            try:
                resultado = gemini.generate_structured(
                    task_type=task_type,
                    payload=payload,
                    diferenciado=diferenciado,
                )
                if isinstance(resultado, dict) and "inclusao" not in resultado:
                    resultado["inclusao"] = inclusao
                return resultado
            except Exception as e:
                print(f"[AIService] ERRO no Gemini (structured): {e}")
                return {"erro": f"IA indisponível no momento: {str(e)}"}

        if self._erro_gemini:
            return {"erro": f"IA não configurada corretamente: {self._erro_gemini}"}

        return self._mock.generate_structured(task_type, payload, diferenciado=diferenciado)

    def generate_structured_multimodal(
        self,
        task_type: str,
        payload: Dict[str, Any],
        parts_anexos: Optional[List[Any]] = None,
        user=None,
    ) -> Dict[str, Any]:
        """
        Geração estruturada MULTIMODAL (texto + imagens/PDF/DOCX).

        Usa a chave do usuário quando cadastrada (Modo Turbo),
        caindo para a chave da plataforma se não houver.

        Args:
            task_type: identificador (ex: 'plano_completo')
            payload: dados textuais do formulário
            parts_anexos: lista de types.Part (imagens/PDF) ou str (texto DOCX extraído)
            user: instância do usuário (para multi-API key)

        Returns:
            Dict com o JSON estruturado devolvido pelo Gemini
        """
        # Multi-API key
        gemini = self._gemini
        if user is not None:
            try:
                from .gemini_service import get_gemini_service_for_user
                gemini = get_gemini_service_for_user(user)
            except Exception as e:
                print(f"[AIService] Erro ao obter Gemini do usuário (multimodal): {e}")
                gemini = self._gemini

        if gemini:
            try:
                return gemini.generate_structured_multimodal(
                    task_type=task_type,
                    payload=payload,
                    parts_anexos=parts_anexos,
                )
            except Exception as e:
                print(f"[AIService] ERRO no Gemini (multimodal): {e}")
                return {"erro": f"IA indisponível no momento: {str(e)}"}

        if self._erro_gemini:
            return {"erro": f"IA não configurada corretamente: {self._erro_gemini}"}

        return {"erro": "Geração multimodal exige a IA real (Gemini). Mock não suportado."}
    
    def generate_structured_batch(
        self,
        task_type: str,
        payload: Dict[str, Any],
        batch_start: int,
        batch_end: int,
        total_aulas: int,
        diferenciado: bool = False,
        user=None,
    ) -> Dict[str, Any]:
        """
        Geração estruturada em LOTES. Delega para o GeminiService.
        Se não houver Gemini configurado, devolve erro claro.
        """
        gemini = self._gemini
        if user is not None:
            try:
                from .gemini_service import get_gemini_service_for_user
                gemini = get_gemini_service_for_user(user)
            except Exception as e:
                print(f"[AIService] Erro ao obter Gemini do usuário (batch): {e}")
                gemini = self._gemini

        if gemini:
            return gemini.generate_structured_batch(
                task_type=task_type,
                payload=payload,
                batch_start=batch_start,
                batch_end=batch_end,
                total_aulas=total_aulas,
                diferenciado=diferenciado,
            )

        if self._erro_gemini:
            return {"erro": f"IA não configurada corretamente: {self._erro_gemini}"}

        return {"erro": "Geração em lotes exige a IA real (Gemini). Mock não suportado."}

    async def generate_structured_stream(self, task_type: str, payload: Dict[str, Any], user=None):
        """Streaming estruturado. Só funciona se o Gemini estiver ativo."""
        # Multi-API key: usa a chave do usuário se disponível
        gemini = self._gemini
        if user is not None:
            try:
                from .gemini_service import get_gemini_service_for_user
                gemini = get_gemini_service_for_user(user)
            except Exception as e:
                print(f"[AIService] Erro ao obter Gemini do usuário (stream): {e}")
                gemini = self._gemini

        if gemini:
            try:
                async for chunk in gemini.generate_structured_stream(task_type, payload):
                    yield chunk
                return
            except Exception as e:
                print(f"[AIService] ERRO no Gemini (structured stream): {e}")
                yield f'{{"erro": "IA indisponível no momento: {str(e)}"}}'
                return

        yield '{"erro": "IA não configurada para streaming."}'

    def generate_chat(
        self,
        messages: List[Dict[str, str]],
        direcionamento_estagio: str = None,
        contexto_tema: str = None,
        user=None,
    ) -> str:
        # Multi-API key: se um usuário foi informado e tem chave própria,
        # usa o Gemini DELE. Caso contrário, cai na chave do sistema.
        gemini = self._gemini
        if user is not None:
            try:
                from .gemini_service import get_gemini_service_for_user
                gemini = get_gemini_service_for_user(user)
            except Exception as e:
                print(f"[AIService] Erro ao obter Gemini do usuário (chat): {e}")
                gemini = self._gemini

        if gemini:
            try:
                return gemini.generate_chat(
                    messages,
                    direcionamento_estagio=direcionamento_estagio,
                    contexto_tema=contexto_tema,
                )
            except Exception as e:
                print(f"[AIService] ERRO no Gemini (chat): {e}")
                return f"[Erro temporário na IA] {str(e)}"

        if self._erro_gemini:
            return f"[IA não configurada] {self._erro_gemini}"

        return self._mock.generate_chat(messages)


# ============================================================
# FÁBRICA
# ============================================================
_ai_service_instance = None


def get_ai_service() -> BaseAIService:
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance