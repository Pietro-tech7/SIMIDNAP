from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# BLOCOS DA LANDING
# ============================================================

class HeroSection(BaseModel):
    enabled: bool = True
    # Modo carrossel: lista de slides
    carousel_enabled: bool = True
    carousel_interval: int = 6000  # ms entre slides
    slides: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "badge": "🇧🇷 Feito por quem conhece sala de aula",
            "brand_line": "SIMIDNAPE PRO · O Professor Inesquecível",
            "headline": "Torne-se O Professor Inesquecível que seus alunos vão lembrar para sempre.",
            "subheadline": "O único assistente pedagógico criado por quem conhece o dia a dia da escola. Sete motores de IA que transformam planejamento, materiais e simulados em minutos.",
            "cta_primary_text": "Quero ser O Professor Inesquecível",
            "cta_primary_link": "/register",
            "cta_secondary_text": "Ver como funciona",
            "cta_secondary_video_url": "",
            "image": "",
            "gradient": "from-blue-50 via-white to-purple-50",
        },
        {
            "badge": "🎁 Oferta de Fundador · Últimas vagas",
            "brand_line": "PROMOÇÃO POR TEMPO LIMITADO",
            "headline": "Os 50 primeiros assinantes travam o preço para sempre.",
            "subheadline": "R$ 14,90/mês (era R$ 19,90) para sempre. Sem reajuste, sem pegadinha. É nosso obrigado por confiar antes de todos.",
            "cta_primary_text": "Quero garantir minha vaga",
            "cta_primary_link": "/register",
            "cta_secondary_text": "",
            "cta_secondary_video_url": "",
            "image": "",
            "gradient": "from-gray-900 via-blue-900 to-gray-900",
        },
        {
            "badge": "👨‍🏫 Criado por quem conhece sala de aula",
            "brand_line": "18+ ANOS DE EDUCAÇÃO",
            "headline": "Criado por quem conhece a educação e o dia a dia da escola.",
            "subheadline": "Darilson Cornélio já impactou mais de 3.500 professores em 23 municípios brasileiros. Este sistema nasceu da escuta real do chão da escola.",
            "cta_primary_text": "Conheça a história",
            "cta_primary_link": "#founder",
            "cta_secondary_text": "",
            "cta_secondary_video_url": "",
            "image": "",
            "gradient": "from-gray-50 via-white to-blue-50",
        },
        {
            "badge": "⚡ 7 motores em um só lugar",
            "brand_line": "O COPILOTO PEDAGÓGICO",
            "headline": "Sete motores. Um copiloto pedagógico.",
            "subheadline": "Planejar aula, gerar material, criar simulado, documentar prática — tudo em um só lugar, alinhado à BNCC e focado em SAEPI, IDEB e ENEM.",
            "cta_primary_text": "Ver os 7 motores",
            "cta_primary_link": "#solution",
            "cta_secondary_text": "",
            "cta_secondary_video_url": "",
            "image": "",
            "gradient": "from-white via-gray-50 to-white",
        },
    ])

    # Campos legados (compatibilidade com versão antiga)
    badge: str = "🇧🇷 Feito por quem conhece sala de aula"
    brand_line: str = "SIMIDNAPE PRO · O Professor Inesquecível"
    headline: str = "Torne-se O Professor Inesquecível que seus alunos vão lembrar para sempre."
    subheadline: str = "O único assistente pedagógico criado por quem conhece sala de aula."
    cta_primary_text: str = "Quero ser O Professor Inesquecível"
    cta_primary_link: str = "/register"
    cta_secondary_text: str = "Ver como funciona"
    cta_secondary_video_url: str = ""
    hero_image: str = ""
    image_placeholder: str = "Foto do slide"
    float_badges: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"icon": "⚡", "title": "Planos em minutos", "subtitle": "Não em horas"},
        {"icon": "🎯", "title": "Alinhado à BNCC", "subtitle": "SAEPI, IDEB e ENEM"},
        {"icon": "🏆", "title": "O Professor Inesquecível", "subtitle": "Sua marca profissional"},
    ])
    metrics: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"value": "7", "label": "motores de IA"},
        {"value": "3.000+", "label": "questões oficiais"},
        {"value": "5", "label": "créditos grátis"},
    ])
    video_enabled: bool = True
    video_url: str = ""


class CredibilityBarSection(BaseModel):
    enabled: bool = True
    items: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "title": "3.500+",
            "description": "Professores impactados",
            "icon": "Em 23 municípios brasileiros com a palestra O Professor Inesquecível",
        },
        {
            "title": "18+",
            "description": "Anos em educação",
            "icon": "Trajetória em sala de aula, neurociência e desenvolvimento humano",
        },
        {
            "title": "7",
            "description": "Motores de IA",
            "icon": "Cada um resolve uma dor real do professor brasileiro",
        },
        {
            "title": "5",
            "description": "Créditos grátis",
            "icon": "Comece a testar agora, sem cartão de crédito",
        },
    ])


class ProblemSection(BaseModel):
    enabled: bool = True
    title: str = "Todo domingo é a mesma história?"
    subtitle: str = "Você não escolheu a educação para virar noite planejando aula."
    image: str = ""
    cards: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "icon": "😩",
            "title": "O domingo que você perde planejando",
            "description": "Enquanto a família almoça, você está na frente do computador escrevendo plano de aula.",
        },
        {
            "icon": "👁️",
            "title": "O aluno que você não consegue alcançar",
            "description": "Você percebe que ele travou, mas não sabe o que fazer diferente.",
        },
        {
            "icon": "📝",
            "title": "O simulado que ninguém quer montar",
            "description": "Procurar questão por questão consome a energia que deveria ir para ensinar.",
        },
    ])
    transition_text: str = "O SIMIDNAPE PRO nasceu para devolver ao professor o que ele mais precisa: tempo."


class SolutionSection(BaseModel):
    enabled: bool = True
    title: str = "Sete motores. Um copiloto pedagógico."
    subtitle: str = "Cada motor resolve uma dor real. Juntos, cobrem todo o ciclo: pensar → planejar → agir → observar → melhorar."
    image: str = ""
    motors: List[Dict[str, Any]] = Field(default_factory=lambda: [
        {
            "icon": "🧠",
            "name": "NeuroAula",
            "description": "Design de aprendizagem com base em neuroeducação.",
            "gradient": "from-purple-500 to-indigo-500",
            "features": [
                "Arquitetura cognitiva passo a passo",
                "Roteiro executável com falas e ações",
                "Adaptações para alunos com laudo",
            ],
        },
        {
            "icon": "❤️",
            "name": "Terapia Pedagógica",
            "description": "Espaço de escuta profissional para o professor.",
            "gradient": "from-pink-500 to-rose-500",
            "features": [
                "Conversa guiada em etapas",
                "Acolhimento sem julgamento",
                "Sugestões de pequenas ações práticas",
            ],
        },
        {
            "icon": "🎯",
            "name": "Aula que Funciona",
            "description": "Script cronometrado de execução em sala.",
            "gradient": "from-blue-500 to-cyan-500",
            "features": [
                "Script minuto a minuto",
                "Checklist de materiais",
                "Intervenções para imprevistos",
            ],
        },
        {
            "icon": "📊",
            "name": "Meu Aluno",
            "description": "Análise pedagógica de situações com alunos.",
            "gradient": "from-green-500 to-emerald-500",
            "features": [
                "Hipóteses pedagógicas a investigar",
                "Intervenções concretas para testar",
                "O que observar para acompanhar",
            ],
        },
        {
            "icon": "📄",
            "name": "Gerador de Materiais",
            "description": "Atividades, jogos e simulados prontos.",
            "gradient": "from-orange-500 to-amber-500",
            "features": [
                "Atividades, jogos e simulados",
                "Gabarito automático",
                "Versão diferenciada inclusiva",
            ],
        },
        {
            "icon": "🏆",
            "name": "Práticas Exitosas",
            "description": "Crie, melhore ou documente práticas pedagógicas.",
            "gradient": "from-teal-500 to-cyan-600",
            "features": [
                "Criar, melhorar ou documentar",
                "Alinhado ao PPAIC e seminários",
                "Para professor e coordenador",
            ],
        },
        {
            "icon": "📚",
            "name": "Banco de Questões ENEM",
            "description": "3.000+ questões oficiais para montar simulados.",
            "gradient": "from-blue-600 to-indigo-700",
            "features": [
                "3.000+ questões oficiais",
                "Filtros por ano, área e disciplina",
                "Gera simulado em PDF",
            ],
        },
    ])

class BeforeAfterSection(BaseModel):
    """Seção Antes vs Depois — mostra a transformação concreta."""
    enabled: bool = True
    title: str = "O que muda quando você usa o SIMIDNAPE PRO"
    subtitle: str = "A diferença entre o professor sobrecarregado e O Professor Inesquecível."
    before_label: str = "Antes"
    after_label: str = "Depois"
    items: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "before": "Domingo inteiro planejando aula",
            "after": "Plano pronto em 2 minutos com IA",
        },
        {
            "before": "Material genérico baixado do Google",
            "after": "Atividades alinhadas à sua turma e à BNCC",
        },
        {
            "before": "Simulado do ENEM: dias de trabalho braçal",
            "after": "Simulado oficial em 3 cliques, com gabarito",
        },
        {
            "before": "Sem tempo para adaptar material inclusivo",
            "after": "Versão diferenciada gerada automaticamente",
        },
        {
            "before": "Prática exitosa que ninguém fica sabendo",
            "after": "Documento profissional para seminários",
        },
        {
            "before": "Fim de semana sem descanso, sem energia",
            "after": "Professor com tempo para si e para a família",
        },
    ])

class FounderSection(BaseModel):
    enabled: bool = True
    title: str = "Uma palavra do criador"
    name: str = "Darilson Cornélio"
    subtitle: str = "Educador há 18+ anos · Psicanalista · Criador da palestra 'O Professor Inesquecível'"
    photo: str = ""
    quote: str = "Ensinar não é transferir conhecimento — é criar marcas que ficam para a vida."
    bio: str = (
        "Darilson Cornélio é educador há mais de 18 anos, com uma trajetória que une "
        "tecnologia, neurociência e desenvolvimento humano.\n\n"
        "Formado em Ciência da Computação pela Universidade Federal do Piauí, decidiu se "
        "aprofundar na educação — pós-graduou-se em Neuropsicopedagogia Clínica, Neuroeducação "
        "e Coaching Educacional, além de atuar como Psicanalista.\n\n"
        "Há mais de 6 anos, percorre o Brasil ministrando a palestra 'O Professor Inesquecível', "
        "onde já impactou mais de 3.500 profissionais da educação em 23 municípios. Na palestra, "
        "trabalha temas como missão de vida, burnout docente, dificuldades emocionais e a tristeza "
        "profunda que muitos professores carregam calados.\n\n"
        "O SIMIDNAPE PRO nasceu dessa escuta: anos ouvindo professores contarem sobre suas dores, "
        "suas dificuldades e, principalmente, sobre o que os faz continuar. É um sistema feito "
        "por quem está no chão da escola, não por quem vê a educação de longe."
    )
    highlight_stats: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"value": "18+", "label": "anos em educação"},
        {"value": "3.500+", "label": "profissionais impactados"},
        {"value": "23", "label": "municípios visitados"},
    ])
    brand_explanation: str = (
        "SIMIDNAPE significa Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem "
        "e Performance Educacional. Nasceu como projeto de rede pública. Virou assistente pedagógico "
        "do professor brasileiro. Hoje é O Professor Inesquecível."
    )
    video_url: str = ""


class VideoSection(BaseModel):
    enabled: bool = True
    title: str = "Veja como funciona em 90 segundos"
    subtitle: str = "Um professor real conta como o SIMIDNAPE PRO mudou a rotina dele."
    video_url: str = ""


class HowItWorksSection(BaseModel):
    enabled: bool = True
    title: str = "Comece em 3 passos"
    subtitle: str = "Do cadastro ao primeiro material pronto em menos de 5 minutos."
    steps: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "number": "1",
            "title": "Crie sua conta grátis",
            "description": "Cinco créditos na hora, sem cartão. Você já pode testar todos os motores.",
        },
        {
            "number": "2",
            "title": "Escolha o motor certo",
            "description": "Planejar aula? Gerar simulado? Documentar prática? Você escolhe por onde começar.",
        },
        {
            "number": "3",
            "title": "Gere, adapte e baixe",
            "description": "Documentos prontos, alinhados à BNCC, formatados em PDF profissional para imprimir.",
        },
    ])


class MetricsSection(BaseModel):
    enabled: bool = True
    title: str = "Números que reforçam a missão"
    subtitle: str = "Cinco anos construindo ferramentas para o professor brasileiro."
    background_image: str = ""  # URL da imagem de fundo (opcional)
    background_overlay: float = 0.85  # opacidade da sobreposição escura (0-1)
    background_video_url: str = ""  # URL do vídeo de fundo (opcional, tem prioridade sobre imagem)
    metrics: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"value": "2 min", "label": "para gerar um plano de aula"},
        {"value": "3.000+", "label": "questões oficiais do ENEM"},
        {"value": "100%", "label": "alinhado à BNCC"},
        {"value": "7", "label": "motores de IA em um só lugar"},
    ])


class TestimonialsSection(BaseModel):
    enabled: bool = True
    title: str = "Histórias reais, resultados concretos"
    subtitle: str = "Professores que usam o SIMIDNAPE PRO contam como ele mudou a rotina."
    kicker: str = "Depoimentos"
    image: str = ""
    image_placeholder: str = "Foto do depoimento"
    empty_message: str = "Em breve: depoimentos de professores que estão usando o SIMIDNAPE PRO."
    video_url: str = ""
    testimonials: List[Dict[str, str]] = Field(default_factory=list)


class ComparisonSection(BaseModel):
    enabled: bool = True
    title: str = "Por que o SIMIDNAPE PRO não é só mais um ChatGPT"
    feature_column_label: str = "Recurso"
    columns: List[str] = Field(default_factory=lambda: [
        "SIMIDNAPE PRO",
        "ChatGPT",
        "Planejar no braço",
    ])
    rows: List[Dict[str, Any]] = Field(default_factory=lambda: [
        {"feature": "Alinhado à BNCC", "values": ["✅", "⚠️", "✅"]},
        {"feature": "Banco com 3.000+ questões ENEM", "values": ["✅", "❌", "❌"]},
        {"feature": "Material diferenciado inclusivo", "values": ["✅", "⚠️", "❌"]},
        {"feature": "Práticas Exitosas para seminários", "values": ["✅", "❌", "⚠️"]},
        {"feature": "Feito para o professor brasileiro", "values": ["✅", "❌", "⚠️"]},
        {"feature": "Pagamento em reais via Pix", "values": ["✅", "❌", "—"]},
        {"feature": "Sem precisar criar prompt", "values": ["✅", "❌", "—"]},
    ])


class FounderOfferSection(BaseModel):
    enabled: bool = True
    badge: str = "🎁 OFERTA DE FUNDADOR"
    title: str = "Os 50 primeiros assinantes travam o preço para sempre."
    description: str = (
        "Os 50 primeiros que assinarem o plano Padrão pagam R$ 14,90/mês "
        "(em vez de R$ 19,90) para sempre. Sem reajuste, sem pegadinha. "
        "É nosso obrigado por confiar antes de todos."
    )
    price_normal: str = "R$ 19,90"
    price_founder: str = "R$ 14,90"
    period_label: str = "para sempre"
    spots_total: int = 50
    spots_remaining: int = 32
    cta_text: str = "Quero garantir minha vaga"
    cta_link: str = "/register"


class PlansSection(BaseModel):
    enabled: bool = True
    title: str = "Escolha seu plano"
    subtitle: str = "Comece grátis. Faça upgrade quando quiser. Cancele a qualquer momento."


class GuaranteeSection(BaseModel):
    enabled: bool = True
    title: str = "Risco zero para você"
    items: List[str] = Field(default_factory=lambda: [
        "Comece grátis — 5 créditos, sem cartão de crédito",
        "Cancele a qualquer momento, sem multa e sem burocracia",
        "Pagamento seguro processado pelo Mercado Pago",
        "Suporte humano por e-mail e WhatsApp",
    ])


class FAQSection(BaseModel):
    enabled: bool = True
    title: str = "Ainda tem dúvida?"
    subtitle: str = "Entre em contato conosco."
    kicker: str = "Perguntas frequentes"
    image: str = ""
    image_placeholder: str = "Foto da professora"
    contact_text: str = "Entre em contato conosco."
    contact_email: str = "contato@simidnape.com.br"
    items: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "question": "O que é o SIMIDNAPE PRO?",
            "answer": "É o assistente pedagógico com 7 motores de IA criado por quem conhece sala de aula. Alinhado à BNCC e focado em resultados (SAEPI, IDEB, ENEM). O nome vem de Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional.",
        },
        {
            "question": "Preciso saber usar IA ou criar prompts?",
            "answer": "Não. Você responde perguntas guiadas em português e a IA gera o conteúdo. Não precisa saber nada de tecnologia.",
        },
        {
            "question": "Funciona para Ensino Médio, Fundamental e Infantil?",
            "answer": "Sim. O SIMIDNAPE PRO atende as três etapas, com categorias, competências e linguagem específicas para cada uma. Tudo alinhado à BNCC.",
        },
        {
            "question": "Como funciona o pagamento?",
            "answer": "Assinatura via Pix (instantâneo) ou cartão de crédito/débito. Você começa com 5 créditos grátis. Depois escolhe o plano mensal (Básico, Padrão ou Avançado) ou compra créditos avulsos — que não expiram.",
        },
        {
            "question": "Posso cancelar quando quiser?",
            "answer": "Sim, sem burocracia. Basta clicar em 'Cancelar' na página Minha Assinatura. Você mantém o acesso até o fim do ciclo já pago.",
        },
        {
            "question": "Os materiais saem prontos para imprimir?",
            "answer": "Sim. Tudo é entregue em PDF profissional, com cabeçalho da sua escola e formatação pronta para imprimir ou compartilhar.",
        },
        {
            "question": "O sistema é seguro para os meus dados?",
            "answer": "Sim. Seguimos a LGPD. Senhas criptografadas, comunicação HTTPS e nenhum dado de aluno é armazenado. Você pode excluir sua conta a qualquer momento.",
        },
    ])


class FinalCTASection(BaseModel):
    enabled: bool = True
    headline: str = "Você pode continuar ensinando como sempre. Ou se tornar O Professor Inesquecível."
    subheadline: str = "Comece agora com 5 créditos grátis. Sem cartão. Sem compromisso. Cancele quando quiser."
    cta_text: str = "Criar minha conta grátis"
    cta_link: str = "/register"


class FooterSection(BaseModel):
    enabled: bool = True
    copyright_text: str = "© 2025 SIMIDNAPE PRO — O Professor Inesquecível. Todos os direitos reservados."
    brand_explanation: str = (
        "SIMIDNAPE significa Sistema Municipal Integral de Desenvolvimento da "
        "Neuroaprendizagem e Performance Educacional."
    )
    tagline: str = (
        "Assistente pedagógico com IA para professores brasileiros. "
        "Neuroeducação, ciência da aprendizagem e respeito à autonomia docente."
    )
    badge_text: str = "🇧🇷 Feito no Brasil · Alinhado à BNCC"
    product_column_title: str = "Produto"
    institutional_column_title: str = "Institucional"
    product_links: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"label": "Motores de IA", "href": "#solution"},
        {"label": "Comparativo", "href": "#comparison"},
        {"label": "Planos", "href": "#plans"},
        {"label": "FAQ", "href": "#faq"},
    ])
    links: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"label": "Sobre", "href": "/sobre"},
        {"label": "Termos de Uso", "href": "/termos"},
        {"label": "Privacidade", "href": "/privacidade"},
        {"label": "Contato", "href": "mailto:contato@simidnape.com.br"},
    ])


class PopupSection(BaseModel):
    # Campos originais (compatibilidade — não remover)
    enabled: bool = False
    title: str = "Oferta de Fundador"
    message: str = "Os 100 primeiros travam o preço para sempre. Restam poucas vagas."
    cta_text: str = "Ver planos"
    cta_link: str = "/register"
    delay_seconds: int = 8
    show_once_per_user: bool = True

    # Campos novos (redesign Bloco 14) — todos com default, sem quebrar config antiga
    badge: str = "🎁 OFERTA DE LANÇAMENTO"
    subtitle: str = "Vagas limitadas para os primeiros assinantes."
    bullets: List[str] = Field(default_factory=lambda: [
        "Preço travado para sempre",
        "Cancele quando quiser, sem multa",
        "Acesso imediato a todos os motores",
    ])
    image: str = ""
    layout: str = "horizontal"  # "horizontal" | "vertical"
    cor_tema: str = "roxo"      # "azul" | "roxo" | "laranja" | "verde" | "preto"


# ============================================================
# HEADER (topo da página) — textos e botões editáveis pelo admin
# ============================================================
class HeaderSection(BaseModel):
    logo_text: str = "SIMIDNAPE PRO"

    # Labels do menu de navegação
    nav_motors_label: str = "Motores de IA"
    nav_how_label: str = "Como funciona"
    nav_comparison_label: str = "Comparativo"
    nav_plans_label: str = "Planos"
    nav_faq_label: str = "FAQ"

    # Botões do topo
    login_text: str = "Entrar"
    register_text: str = "Criar conta grátis"


# ============================================================
# PÁGINA DE ERRO / CARREGAMENTO — textos editáveis pelo admin
# ============================================================
class ErrorPageSection(BaseModel):
    loading_text: str = "Carregando..."
    title: str = "SIMIDNAPE PRO"
    subtitle: str = "O assistente pedagógico com IA para professores brasileiros."
    register_text: str = "Criar conta grátis"
    login_text: str = "Já tenho conta"


# ============================================================
# TELA DE LOGIN — foto e textos editáveis pelo admin
# ============================================================
class LoginSection(BaseModel):
    enabled: bool = True
    photo: str = ""
    welcome_title: str = "Bem-vindo de volta."
    welcome_subtitle: str = "Sua próxima aula inesquecível começa aqui."
    benefits: List[str] = Field(default_factory=lambda: [
        "Continue de onde parou — todo seu histórico salvo",
        "Acesse os 9 motores de IA pedagógica",
        "Gerencie seus créditos e plano quando quiser",
        "Suporte humano para professores brasileiros",
    ])


# ============================================================
# TELA DE CADASTRO — foto e textos editáveis pelo admin
# ============================================================
class RegisterSection(BaseModel):
    enabled: bool = True
    photo: str = ""
    welcome_title: str = "Crie sua conta."
    welcome_subtitle: str = "7 créditos grátis para testar. Sem cartão de crédito."


# ============================================================
# PAINEL DO USUÁRIO — textos do Dashboard editáveis pelo admin
# ============================================================
class DashboardSection(BaseModel):
    enabled: bool = True
    greeting_prefix: str = "Olá,"
    greeting_suffix: str = "— O PROFESSOR INESQUECÍVEL"
    subtitle: str = "O que você precisa resolver hoje?"
    tip_title: str = "💡 Dica do SIMIDNAPE"
    tip_text: str = (
        "Comece pelo NeuroAula para planejar sua próxima aula ou use a "
        "IA para Professor para tirar dúvidas rápidas."
    )


# ============================================================
# BANNER DO MODO TURBO (antes "API Key") — textos editáveis pelo admin
# ============================================================
class ApiBannerSection(BaseModel):
    enabled: bool = True
    # Variante badge (pill no header)
    badge_pill_text: str = "Cadastre sua API"
    badge_pill_tooltip: str = "Ative o Modo Turbo e libere centenas de créditos por mês"
    # Variante card (banner grande no Dashboard)
    card_badge: str = "⚡ Recomendado"
    card_title: str = "🔑 Ative o Modo Turbo e multiplique seus créditos"
    card_subtitle: str = (
        "É gratuita, leva 2 minutos e libera centenas de créditos por mês "
        "sem custo adicional."
    )
    card_bullets: List[str] = Field(default_factory=lambda: [
        "De 10 para até 500 créditos/mês no plano Básico — e ainda mais nos planos superiores",
        "Chave gratuita do Google (você não paga nada além da assinatura)",
        "Tutorial passo a passo com imagens + suporte via WhatsApp",
    ])
    cta_primary_text: str = "🚀 Ativar Modo Turbo agora"
    cta_secondary_text: str = "📖 Ver tutorial"


# ============================================================
# PAGAMENTO — dados fiscais e de suporte editáveis pelo admin
# ============================================================
class PaymentSection(BaseModel):
    enabled: bool = True
    # Emitente (aparece no rodapé do modal)
    emitter_name: str = "SIMIDNAPE PRO"
    emitter_document: str = ""  # "CNPJ 00.000.000/0001-00" ou "CPF 000.000.000-00"
    # Contato de suporte
    support_email: str = "contato@simidnape.com.br"
    support_phone: str = ""
    # Textos legais
    terms_text: str = "Ao concluir, você aceita os Termos de Uso e a Política de Privacidade."
    terms_link: str = "/termos"
    privacy_link: str = "/privacidade"


# ============================================================
# SCHEMA PRINCIPAL
# ============================================================
class LandingConfigSchema(BaseModel):
    sections_order: List[str] = Field(default_factory=lambda: [
        "hero",
        "credibility",
        "problem",
        "before_after",
        "solution",
        "founder",
        "video",
        "how_it_works",
        "metrics",
        "testimonials",
        "comparison",
        "founder_offer",
        "plans",
        "guarantee",
        "faq",
        "final_cta",
        "footer",
    ])

    seo_title: str = "SIMIDNAPE PRO — O Professor Inesquecível | Assistente pedagógico com IA"
    seo_description: str = (
        "7 motores de IA para planejar aulas, gerar materiais, criar práticas exitosas "
        "e preparar simulados do ENEM. Alinhado à BNCC. Comece grátis."
    )

    primary_color: str = "#2563eb"
    accent_color: str = "#0f172a"

    hero: HeroSection = Field(default_factory=HeroSection)
    credibility: CredibilityBarSection = Field(default_factory=CredibilityBarSection)
    problem: ProblemSection = Field(default_factory=ProblemSection)
    before_after: BeforeAfterSection = Field(default_factory=BeforeAfterSection)
    solution: SolutionSection = Field(default_factory=SolutionSection)
    founder: FounderSection = Field(default_factory=FounderSection)
    video: VideoSection = Field(default_factory=VideoSection)
    how_it_works: HowItWorksSection = Field(default_factory=HowItWorksSection)
    metrics: MetricsSection = Field(default_factory=MetricsSection)
    testimonials: TestimonialsSection = Field(default_factory=TestimonialsSection)
    comparison: ComparisonSection = Field(default_factory=ComparisonSection)
    founder_offer: FounderOfferSection = Field(default_factory=FounderOfferSection)
    plans: PlansSection = Field(default_factory=PlansSection)
    guarantee: GuaranteeSection = Field(default_factory=GuaranteeSection)
    faq: FAQSection = Field(default_factory=FAQSection)
    final_cta: FinalCTASection = Field(default_factory=FinalCTASection)
    footer: FooterSection = Field(default_factory=FooterSection)
    popup: PopupSection = Field(default_factory=PopupSection)
    header: HeaderSection = Field(default_factory=HeaderSection)
    error_page: ErrorPageSection = Field(default_factory=ErrorPageSection)
    login: LoginSection = Field(default_factory=LoginSection)
    register: RegisterSection = Field(default_factory=RegisterSection)
    dashboard: DashboardSection = Field(default_factory=DashboardSection)
    api_banner: ApiBannerSection = Field(default_factory=ApiBannerSection)
    payment: PaymentSection = Field(default_factory=PaymentSection)


class LandingConfigOut(BaseModel):
    id: UUID
    config: LandingConfigSchema
    updated_at: Optional[datetime]
    updated_by: Optional[UUID]

    class Config:
        from_attributes = True


def get_default_landing_config() -> dict:
    return LandingConfigSchema().model_dump()