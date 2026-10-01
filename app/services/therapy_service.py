from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..models.reflection import Reflection
from .ai_service import get_ai_service


# ============================================================
# TEMAS DISPONÍVEIS
# Cada tema tem: nome, abertura, e um CONTEXTO PRÓPRIO que orienta a IA.
# O contexto NÃO é um rótulo. É um guia de conversa específico.
# ============================================================
TEMAS = {
    "relacao_professor_aluno": {
        "nome": "Relação Professor-Aluno",
        "abertura": "Vamos conversar sobre sua relação com os alunos. O que tem te mobilizado ultimamente? Pode falar com liberdade — estou aqui para ouvir.",
        "contexto": """TEMA: RELAÇÃO PROFESSOR-ALUNO.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Aluno que ignora, que se fecha, que rejeita.
- Aluno que gruda demais, que busca atenção constante.
- Vínculo difícil com a turma inteira.
- Aluno que desafia, provoca, testa limites.
- Aluno que mudou de comportamento recentemente.
- Sensação de não estar alcançando ninguém.

COMO CONDUZIR A CONVERSA:
- Explore QUANDO a situação acontece (é sempre? em quais momentos?).
- Explore em QUAIS situações (individual, em grupo, em avaliações, em atividades específicas).
- Explore o que acontece ANTES, DURANTE e DEPOIS dos episódios.
- Explore como o professor reage e o que ele sente nessas horas.
- Explore se o comportamento é generalizado ou restrito a esse professor/aluno.
- Explore se houve MUDANÇA recente (algo mudou na vida do aluno? na turma? no professor?).
- Ajude o professor a olhar a situação por diferentes ângulos: o que pode estar por trás do comportamento dele? o que o professor projeta nessa relação?

PERGUNTAS QUE AJUDAM:
- "Quando isso começou?"
- "Acontece com outros professores ou só com você?"
- "O que costuma acontecer pouco antes de ele reagir assim?"
- "Como você se sente quando isso acontece?"
- "O que você já tentou fazer?"

NÃO FAÇA PERGUNTAS ALEATÓRIAS. Toda pergunta deve nascer do que o professor relatou.

BASE CONCEITUAL (use sem citar como rótulo):
- Transferência (o aluno projeta no professor figuras do passado).
- Idealização (o professor idealiza o aluno perfeito; o aluno idealiza o professor que sabe tudo).
- Holding (sustentar sem invadir).
- Vínculo como base da aprendizagem.
- Papel do professor como referência de segurança emocional.

ENCAMINHAMENTO:
Se o relato indicar sofrimento intenso do professor, conflito que ultrapassa o pedagógico ou sinais que exigem atenção clínica do aluno, sugerir gentilmente conversa com a equipe pedagógica ou profissional qualificado."""
    },

    "gestao_conflitos": {
        "nome": "Gestão de Conflitos",
        "abertura": "Vamos falar sobre conflitos. Conte-me o que aconteceu. Sem pressa, sem julgamento.",
        "contexto": """TEMA: GESTÃO DE CONFLITOS.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Brigas entre alunos.
- Indisciplina, desrespeito, provocações.
- Professor que gritou, perdeu o controle, ou se arrependeu de uma reação.
- Conflito recorrente com a turma inteira ou com um aluno específico.
- Sensação de que a sala "saiu do controle".
- Reação impulsiva seguida de culpa.

COMO CONDUZIR A CONVERSA:
- Explore o que aconteceu ANTES do conflito (o que estava em jogo?).
- Explore o que o professor sentiu NO MOMENTO (no corpo também: tensão, calor, coração acelerado).
- Explore como ele reagiu e o que aconteceu depois.
- Explore se esse tipo de conflito se repete e quais são os gatilhos.
- Explore o que ele gostaria de ter feito diferente.
- Ajude-o a separar "o que aconteceu" de "o que ele interpretou".

PERGUNTAS QUE AJUDAM:
- "O que exatamente aconteceu antes do conflito?"
- "O que você sentiu no corpo naquele momento?"
- "Como você reagiu? Como gostaria de ter reagido?"
- "Isso se repete? Em que situações?"

NÃO FAÇA PERGUNTAS ALEATÓRIAS. Toda pergunta deve nascer do que o professor relatou.

BASE CONCEITUAL (sem citar como rótulo):
- Resposta de estresse (amígdala vs. córtex pré-frontal).
- Comunicação não violenta (observação, sentimento, necessidade, pedido).
- Regulação emocional antes da intervenção pedagógica.
- Distinção entre reação (impulso) e resposta (escolha).

ENCAMINHAMENTO:
Se houver violência física, risco a alguém ou situações que ultrapassem a sala de aula, orientar a procurar a gestão escolar e, se necessário, apoio especializado."""
    },

    "motivacao_engajamento": {
        "nome": "Motivação e Engajamento",
        "abertura": "Vamos conversar sobre motivação — sua, da turma ou de um aluno específico. Como você tem se sentido em relação a isso?",
        "contexto": """TEMA: MOTIVAÇÃO E ENGAJAMENTO.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Turma apática, desinteressada, que não participa.
- Aluno específico que se desconectou.
- Professor que perdeu a motivação para ensinar.
- Sensação de que a aula "não engata".
- Dificuldade de tornar o conteúdo interessante.

COMO CONDUZIR A CONVERSA:
- Explore de quem é a desmotivação: do professor, da turma ou de um aluno.
- Explore quando isso começou e se houve mudança recente.
- Explore o que costuma mobilizar os alunos (o que eles gostam? o que os interessa?).
- Explore o que costumava funcionar e deixou de funcionar.
- Explore o que o professor sente diante dessa apatia.
- Ajude-o a ver a desmotivação como sinal, não como falha pessoal.

PERGUNTAS QUE AJUDAM:
- "De quem é essa desmotivação: sua, da turma ou de um aluno?"
- "Quando isso começou? Houve alguma mudança?"
- "O que costumava funcionar e mudou?"
- "O que você sente quando vê a turma apática?"

NÃO FAÇA PERGUNTAS ALEATÓRIAS.

BASE CONCEITUAL (sem citar como rótulo):
- Motivação intrínseca vs. extrínseca.
- Modelo PERMA (emoções positivas, engajamento, relações, significado, realização).
- Senso de pertencimento e sentido.
- Micro-hábitos e pequenas mudanças.

ENCAMINHAMENTO:
Se o professor relatar desmotivação profunda, perda de sentido persistente ou sofrimento intenso, sugerir apoio profissional."""
    },

    "ansiedade_sobrecarga": {
        "nome": "Ansiedade e Sobrecarga",
        "abertura": "Este é um espaço seguro. Me conta: como você está se sentindo ultimamente? O que tem pesado mais?",
        "contexto": """TEMA: ANSIEDADE E SOBRECARGA.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Exaustão, esgotamento, cansaço que não passa.
- Sensação de não dar conta, de estar sempre atrasado.
- Medo de dar aula, ansiedade antes de entrar em sala.
- Dificuldade de dormir, de relaxar, de desligar.
- Pressão por resultados, por avaliações externas, por metas.
- Sensação de estar "no limite".

COMO CONDUZIR A CONVERSA:
- Acolha. Este é um tema delicado e exige cuidado.
- Explore quando o cansaço começou e se foi gradual ou repentino.
- Explore o que mais pesa (carga horária? relações? cobrança? deslocamento? múltiplos vínculos?).
- Explore o que o professor tem feito para se cuidar.
- Explore se ele tem rede de apoio (família, amigos, colegas).
- NÃO minimize. NÃO diga "todo professor passa por isso".

PERGUNTAS QUE AJUDAM:
- "Quando esse cansaço começou? Foi gradual?"
- "O que mais pesa hoje na sua rotina?"
- "Você tem conseguido algum momento só seu?"
- "Você tem com quem conversar sobre isso?"

NÃO FAÇA PERGUNTAS ALEATÓRIAS.

BASE CONCEITUAL (sem citar como rótulo):
- Resposta de estresse crônico (cortisol).
- Autocompaixão (Kristin Neff).
- Micro-hábitos de cuidado (2 minutos por dia).
- Limites saudáveis como condição para sustentabilidade.

ENCAMINHAMENTO OBRIGATÓRIO:
Se houver sinais de sofrimento intenso, persistente, crises, insônia grave, pensamentos difíceis — sugerir com clareza e gentileza: "O que você está vivendo merece o cuidado de um profissional. Isso não é fraqueza — é responsabilidade com você mesmo." Sugerir psicólogo, médico de família ou serviço de apoio."""
    },

    "relacao_colegas_gestao": {
        "nome": "Relação com Colegas e Gestão",
        "abertura": "Vamos falar sobre sua relação com colegas e coordenação. O que tem acontecido?",
        "contexto": """TEMA: RELAÇÃO COM COLEGAS E GESTÃO.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Conflito com coordenador, diretor, outro professor.
- Sensação de não ser ouvido, de ser invisível, de ser desvalorizado.
- Sobrecarga de tarefas injusta.
- Ambiente tóxico, intrigas, favoritismo.
- Reuniões que desgastam.
- Falta de apoio da equipe pedagógica.

COMO CONDUZIR A CONVERSA:
- Explore o que aconteceu e em quais contextos (reuniões, corredores, decisões pedagógicas).
- Explore como o professor interpretou a situação (o que ele achou que estava em jogo?).
- Explore se é uma situação pontual ou recorrente.
- Explore como o professor tem se posicionado.
- Ajude-o a separar o que é dele do que é da outra pessoa (o que o outro vive? o que o outro projeta?).
- Ajude-o a pensar em pequenas formas de se posicionar com clareza e respeito.

PERGUNTAS QUE AJUDAM:
- "O que aconteceu exatamente?"
- "Isso é pontual ou recorrente?"
- "Como você interpretou a reação dele(a)?"
- "Como você tem se posicionado?"
- "O que você gostaria que fosse diferente?"

BASE CONCEITUAL (sem citar como rótulo):
- Comunicação não violenta (observação, sentimento, necessidade, pedido).
- Assertividade e limites saudáveis.
- Projeções nas relações de trabalho.
- Contexto institucional e cultura escolar.

ENCAMINHAMENTO:
Se houver assédio, discriminação ou situações que exijam medida institucional formal, orientar o professor a registrar e buscar os canais adequados."""
    },

    "relacao_pais": {
        "nome": "Relação com Pais e Responsáveis",
        "abertura": "Vamos conversar sobre sua relação com as famílias. O que tem sido mais difícil?",
        "contexto": """TEMA: RELAÇÃO COM PAIS E RESPONSÁVEIS.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Reuniões difíceis, cobranças, confrontos.
- Pais ausentes, omissos.
- Pais superprotetores, que questionam tudo.
- Sensação de desvalorização profissional.
- Comunicação tensa por mensagens, cadernos, telefonemas.
- Conflitos por causa de notas, comportamento ou disciplina.

COMO CONDUZIR A CONVERSA:
- Explore o que aconteceu e como foi a comunicação.
- Explore como o professor se sentiu na situação.
- Explore o histórico (é a primeira vez? já aconteceu outras?).
- Explore o que ele já tentou para melhorar a comunicação.
- Ajude-o a separar o que é demanda legítima dos pais do que é projeção.
- Ajude-o a construir um posicionamento profissional, firme e respeitoso.

PERGUNTAS QUE AJUDAM:
- "O que aconteceu?"
- "Como foi a comunicação?"
- "Isso é pontual ou recorrente?"
- "Como você se sentiu depois?"
- "O que você gostaria que fosse diferente?"

BASE CONCEITUAL (sem citar como rótulo):
- Comunicação não violenta.
- Escuta ativa e empatia.
- Limites profissionais.
- Escola e família como parceiras (não como adversárias).

ENCAMINHAMENTO:
Se houver agressividade, ameaça ou situação que exija mediação da gestão, orientar a buscar apoio institucional."""
    },

    "autoconhecimento_proposito": {
        "nome": "Autoconhecimento e Propósito",
        "abertura": "Vamos conversar sobre você e seu propósito como professor. O que tem te feito refletir ultimamente?",
        "contexto": """TEMA: AUTOCONHECIMENTO E PROPÓSITO.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Dúvida sobre continuar na docência.
- Sensação de que o trabalho perdeu sentido.
- Cansaço existencial, não apenas físico.
- Questionamento sobre identidade profissional.
- Sensação de que "não é mais o mesmo".
- Reflexões sobre valores, missão, legado.

COMO CONDUZIR A CONVERSA:
- Explore quando essa reflexão começou.
- Explore o que costumava dar sentido e o que mudou.
- Explore o que ainda faz o professor levantar da cama para dar aula.
- Explore os valores pessoais e como eles se conectam (ou não) com a prática.
- Ajude-o a olhar para a própria história (por que escolheu ser professor? o que já viveu de significativo?).
- NÃO apresse conclusões. Esse tema pede tempo.

PERGUNTAS QUE AJUDAM:
- "Quando você começou a sentir isso?"
- "Houve algum momento específico ou foi se acumulando?"
- "O que ainda te faz levantar para dar aula?"
- "O que te fez escolher ser professor?"
- "Que momentos te marcaram positivamente na docência?"

BASE CONCEITUAL (sem citar como rótulo):
- Sentido e propósito (Viktor Frankl).
- Modelo PERMA (significado, realização).
- Identidade profissional e valores pessoais.
- Reflexão sobre trajetória.

ENCAMINHAMENTO:
Se houver desesperança, sofrimento intenso ou pensamentos que preocupem, sugerir apoio psicológico com clareza."""
    },

    "emocoes_sala": {
        "nome": "Emoções em Sala",
        "abertura": "Vamos falar sobre o que você sente dentro da sala de aula. Me conta o que tem acontecido.",
        "contexto": """TEMA: EMOÇÕES EM SALA.

SITUAÇÕES TÍPICAS DESTE TEMA:
- Raiva, frustração, irritação durante a aula.
- Tristeza, impotência, vontade de chorar.
- Medo, ansiedade antes ou durante a aula.
- Alegria, orgulho, satisfação (também vale conversar sobre o positivo).
- Emoções que surgem de repente e assustam o professor.
- Sensação de estar "no automático" ou desconectado.

COMO CONDUZIR A CONVERSA:
- Explore QUAL emoção está presente e COMO ela se manifesta.
- Explore em QUE momentos ela aparece (início da aula? durante atividades? em avaliações?).
- Explore o que costuma acionar essa emoção.
- Explore como o professor lida com ela (reprime? explode? ignora?).
- Ajude-o a nomear a emoção com precisão (raiva? frustração? impotência? medo?).
- Ajude-o a ver que toda emoção comunica algo.

PERGUNTAS QUE AJUDAM:
- "Que emoção está mais presente?"
- "Em que momentos ela costuma aparecer?"
- "O que costuma acionar isso?"
- "Como você tem lidado com essa emoção?"
- "O que ela pode estar querendo te dizer?"

BASE CONCEITUAL (sem citar como rótulo):
- Regulação emocional (nomear para regular).
- Amígdala e córtex pré-frontal.
- Autocompaixão.
- Emoções como informação, não como falha.

ENCAMINHAMENTO:
Se houver sofrimento intenso, crises, ou emoções que estejam comprometendo a vida pessoal e profissional, sugerir apoio profissional."""
    },

    "livre": {
        "nome": "Conversa Livre",
        "abertura": "Estou aqui para ouvir. Pode falar sobre o que quiser, sem tema definido. O que está na sua cabeça agora?",
        "contexto": """TEMA: CONVERSA LIVRE.

O professor não escolheu um tema específico. Ele quer conversar sobre o que está presente para ele AGORA.

COMO CONDUZIR A CONVERSA:
- Ouça com atenção. Deixe-o conduzir.
- NÃO force um tema. Se ele falar de relação com alunos, trabalhe relação. Se falar de cansaço, trabalhe cansaço.
- Identifique o tema subjacente conforme a conversa se desenrola e ajuste o foco.
- Use o mesmo ciclo: SITUAÇÃO → ESCUTA → EXPLORAÇÃO → REFLEXÃO → NOVA PERSPECTIVA → AÇÃO → ACOMPANHAMENTO.
- Faça perguntas que nasçam do que ele trouxe.
- Ajude-o a olhar por ângulos diferentes.
- Proponha pequenas ações quando fizer sentido.

PERGUNTAS QUE AJUDAM:
- "Me conta um pouco mais sobre isso."
- "Como você se sentiu quando isso aconteceu?"
- "O que você já tentou?"
- "O que seria diferente se essa situação melhorasse?"

BASE CONCEITUAL:
Conforme o tema subjacente emergir, use Psicanálise, Neurociência, Psicologia Positiva, Comunicação Não Violenta ou Educação Inclusiva — sempre de forma integrada e sem rótulo.

ENCAMINHAMENTO:
Se identificar sinais que ultrapassem o campo pedagógico (sofrimento intenso, violência, risco), sugerir apoio profissional com clareza e gentileza."""
    },
}


# ============================================================
# DIRECIONAMENTO POR ESTÁGIO DA CONVERSA
# ============================================================
DIRECIONAMENTO_ESTAGIO = {
    1: (
        "ESTÁGIO 1 (primeira mensagem do professor). Sua tarefa agora é: "
        "acolher a emoção do professor de forma genuína e fazer UMA pergunta de exploração "
        "que nasça do que ele relatou. A pergunta deve ajudar a entender melhor a situação. "
        "NÃO ofereça novas perspectivas ainda. NÃO sugira ações. "
        "Apenas ouça e aprofunde. Resposta curta: 2-3 parágrafos."
    ),
    2: (
        "ESTÁGIO 2 (segunda mensagem do professor). Sua tarefa agora é: "
        "validar o que ele sentiu e aprofundar mais. Faça UMA pergunta que explore "
        "o que passou pela cabeça dele, como ele se sentiu no corpo, ou o que aconteceu antes/depois. "
        "NÃO ofereça soluções ainda. Resposta curta: 2-3 parágrafos."
    ),
    3: (
        "ESTÁGIO 3 (terceira mensagem do professor). Sua tarefa agora é: "
        "oferecer uma NOVA LENTE sobre a situação — uma perspectiva diferente que ajude o professor "
        "a olhar o problema por outro ângulo. Use o conhecimento pedagógico e científico que você tem, "
        "mas SEM citar teorias ou rótulos. Termine com uma pergunta suave que devolva a reflexão ao professor. "
        "NÃO sugira ações ainda."
    ),
    4: (
        "ESTÁGIO 4 (quarta mensagem em diante). Sua tarefa agora é: "
        "sugerir UMA pequena ação prática que o professor possa tentar na próxima aula ou no próximo dia. "
        "Algo concreto, viável e pequeno. Depois, pergunte como ele se sente com essa ideia. "
        "Mantenha o acolhimento. Se o professor quiser continuar aprofundando, continue explorando — "
        "não force o encerramento."
    ),
}


# ============================================================
# SERVIÇOS DE PERSISTÊNCIA
# ============================================================
def start_reflection(db: Session, user_id: str, theme: str = None, title: str = None) -> Reflection:
    tema = theme or "livre"
    tema_info = TEMAS.get(tema, TEMAS["livre"])

    abertura = tema_info["abertura"]
    messages = [
        {"role": "assistant", "content": abertura}
    ]

    reflection = Reflection(
        user_id=user_id,
        title=title or tema_info["nome"],
        theme=tema,
        messages=messages,
    )
    db.add(reflection)
    db.commit()
    db.refresh(reflection)
    return reflection


def add_message(db: Session, user_id: str, reflection_id: str, content: str, user=None) -> Dict[str, Any]:
    reflection = db.query(Reflection).filter(
        Reflection.id == reflection_id,
        Reflection.user_id == user_id
    ).first()

    if not reflection:
        return None

    mensagens_atuais = list(reflection.messages) if reflection.messages else []

    # Conta quantas mensagens o professor já enviou para definir o estágio
    total_mensagens_professor = sum(1 for m in mensagens_atuais if m.get("role") == "user")
    estagio = total_mensagens_professor + 1
    if estagio > 4:
        estagio = 4

    # Adiciona a mensagem do professor
    mensagens_atuais.append({"role": "user", "content": content})

    # Busca o contexto do tema escolhido
    tema_info = TEMAS.get(reflection.theme or "livre", TEMAS["livre"])
    contexto_tema = tema_info.get("contexto", "")

    # Direcionamento do estágio atual
    direcionamento = DIRECIONAMENTO_ESTAGIO.get(estagio, DIRECIONAMENTO_ESTAGIO[4])

    # Chama a IA real com contexto do tema + direcionamento do estágio
    ai = get_ai_service()
    try:
        resposta = ai.generate_chat(
            mensagens_atuais,
            direcionamento_estagio=direcionamento,
            contexto_tema=contexto_tema,
            user=user,
        )
    except Exception as e:
        print(f"[therapy_service] Erro ao gerar resposta: {e}")
        resposta = (
            "Estou aqui com você. Pode continuar me contando o que aconteceu — "
            "quero entender melhor antes de te responder."
        )

    mensagens_atuais.append({"role": "assistant", "content": resposta})

    reflection.messages = mensagens_atuais
    db.commit()
    db.refresh(reflection)

    return {
        "reflection": reflection,
        "reply": {"role": "assistant", "content": resposta},
    }


def list_reflections(db: Session, user_id: str) -> List[Reflection]:
    return db.query(Reflection).filter(Reflection.user_id == user_id).order_by(Reflection.updated_at.desc()).all()


def get_reflection(db: Session, user_id: str, reflection_id: str) -> Reflection:
    return db.query(Reflection).filter(
        Reflection.id == reflection_id,
        Reflection.user_id == user_id
    ).first()


def delete_reflection(db: Session, user_id: str, reflection_id: str):
    reflection = get_reflection(db, user_id, reflection_id)
    if reflection:
        db.delete(reflection)
        db.commit()
    return reflection


def list_themes() -> List[Dict[str, str]]:
    """Retorna a lista de temas disponíveis."""
    return [{"codigo": k, "nome": v["nome"]} for k, v in TEMAS.items()]