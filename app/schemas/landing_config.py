from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# BLOCOS DA LANDING
# ============================================================

class HeroSection(BaseModel):
    enabled: bool = True
    badge: str = "🇧🇷 Feito por professor, para professor"
    brand_line: str = "SIMIDNAPE PRO — O Professor Inesquecível"
    headline: str = "Torne-se O Professor Inesquecível que seus alunos vão lembrar para sempre."
    subheadline: str = (
        "O SIMIDNAPE PRO é o copiloto pedagógico com IA que transforma sua prática diária "
        "em aulas que engajam, materiais que funcionam e resultados que aparecem no SAEPI, IDEB e ENEM."
    )
    cta_primary_text: str = "Quero ser O Professor Inesquecível"
    cta_primary_link: str = "/register"
    cta_secondary_text: str = "Ver demonstração"
    cta_secondary_video_url: str = ""
    video_enabled: bool = True
    video_url: str = ""
    hero_image: str = ""  # URL da foto principal (lado direito do hero)
    bg_image: str = ""    # URL da imagem de fundo (opcional)
    # 3 badges flutuantes sobre a foto (estilo Isaac)
    float_badges: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"icon": "⚡", "title": "Planos em minutos", "subtitle": "Não em horas"},
        {"icon": "🎯", "title": "Alinhado à BNCC", "subtitle": "SAEPI, IDEB e ENEM"},
        {"icon": "🏆", "title": "O Professor Inesquecível", "subtitle": "Sua marca profissional"},
    ])
    metrics: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"value": "7", "label": "motores de IA"},
        {"value": "3.000+", "label": "questões ENEM"},
        {"value": "5", "label": "créditos grátis"},
    ])


class CredibilityBarSection(BaseModel):
    enabled: bool = True
    items: List[str] = Field(default_factory=lambda: [
        "Alinhado à BNCC",
        "Foco em SAEPI, IDEB e ENEM",
        "Banco com 3.000+ questões oficiais",
        "Pagamento via Pix e cartão",
    ])


class ProblemSection(BaseModel):
    enabled: bool = True
    title: str = "Você reconhece essa rotina?"
    subtitle: str = "Você não entrou na educação para passar domingos inteiros planejando aula."
    image: str = ""
    cards: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "icon": "😩",
            "title": "Domingo inteiro planejando aula",
            "description": "Você deveria estar descansando, mas está criando plano de aula para a segunda-feira.",
        },
        {
            "icon": "⏰",
            "title": "Sem tempo para material diferenciado",
            "description": "A inclusão é lei, mas criar duas versões do mesmo material consome horas que você não tem.",
        },
        {
            "icon": "📝",
            "title": "Simulado do ENEM dá trabalho demais",
            "description": "Procurar questão por questão, montar prova, gabarito... horas de trabalho braçal.",
        },
    ])
    transition_text: str = "O SIMIDNAPE PRO foi feito para mudar isso."


class SolutionSection(BaseModel):
    enabled: bool = True
    title: str = "7 motores de IA em um só lugar"
    subtitle: str = "Cada motor resolve uma dor específica do professor. Todos alinhados à BNCC e focados em resultados."
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


class FounderSection(BaseModel):
    enabled: bool = True
    title: str = "Uma palavra do criador"
    name: str = "Darilson Cornélio"
    subtitle: str = "Psicanalista, Educador e Criador do SIMIDNAPE"
    photo: str = ""
    quote: str = "Ensinar não é transferir conhecimento — é criar marcas que ficam para a vida."
    bio: str = (
        "Criei o SIMIDNAPE porque vi professores brilhantes sendo consumidos por um sistema "
        "que não os apoia. Este não é um gerador de textos genérico. É um copiloto pedagógico "
        "que respeita a sua autonomia e fortalece a sua prática."
    )
    brand_explanation: str = (
        "SIMIDNAPE significa Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem "
        "e Performance Educacional. Nasceu como um projeto de rede pública e evoluiu para o "
        "assistente pedagógico do professor brasileiro — O Professor Inesquecível."
    )
    video_url: str = ""


class VideoSection(BaseModel):
    enabled: bool = True
    title: str = "Veja como funciona em 90 segundos"
    subtitle: str = "Um professor real conta como o SIMIDNAPE PRO mudou a rotina dele."
    video_url: str = ""


class HowItWorksSection(BaseModel):
    enabled: bool = True
    title: str = "Como funciona"
    subtitle: str = "Do zero ao material pronto em minutos."
    steps: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "number": "1",
            "title": "Crie sua conta",
            "description": "Grátis, com 5 créditos para testar. Sem cartão de crédito.",
        },
        {
            "number": "2",
            "title": "Escolha seu motor",
            "description": "NeuroAula, Materiais, Banco de Questões — você escolhe por onde começar.",
        },
        {
            "number": "3",
            "title": "Gere, adapte e baixe",
            "description": "Documentos prontos, alinhados à BNCC e formatados profissionalmente em PDF.",
        },
    ])


class MetricsSection(BaseModel):
    enabled: bool = True
    title: str = "Resultados que falam por si"
    metrics: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"value": "2 min", "label": "para gerar um plano de aula"},
        {"value": "3.000+", "label": "questões oficiais do ENEM"},
        {"value": "100%", "label": "alinhado à BNCC"},
        {"value": "7", "label": "motores de IA em um só lugar"},
    ])


class TestimonialsSection(BaseModel):
    enabled: bool = True
    title: str = "Histórias reais, resultados concretos"
    subtitle: str = "Professores reais contam como o SIMIDNAPE PRO mudou a rotina deles."
    image: str = ""
    video_url: str = ""
    testimonials: List[Dict[str, str]] = Field(default_factory=list)


class ComparisonSection(BaseModel):
    enabled: bool = True
    title: str = "Por que o SIMIDNAPE PRO não é um ChatGPT"
    columns: List[str] = Field(default_factory=lambda: [
        "SIMIDNAPE PRO",
        "ChatGPT",
        "Planejar manualmente",
    ])
    rows: List[Dict[str, Any]] = Field(default_factory=lambda: [
        {"feature": "Alinhado à BNCC", "values": ["✅", "⚠️", "✅"]},
        {"feature": "Banco de Questões ENEM", "values": ["✅", "❌", "❌"]},
        {"feature": "Material Diferenciado (inclusivo)", "values": ["✅", "⚠️", "❌"]},
        {"feature": "Práticas Exitosas para seminários", "values": ["✅", "❌", "⚠️"]},
        {"feature": "Específico para professores brasileiros", "values": ["✅", "❌", "⚠️"]},
        {"feature": "Pagamento em reais via Pix", "values": ["✅", "❌", "—"]},
    ])


class PlansSection(BaseModel):
    enabled: bool = True
    title: str = "Escolha seu plano"
    subtitle: str = "Comece grátis. Faça upgrade quando quiser. Cancele a qualquer momento."


class GuaranteeSection(BaseModel):
    enabled: bool = True
    title: str = "Garantia total"
    items: List[str] = Field(default_factory=lambda: [
        "Comece grátis — sem cartão de crédito",
        "Cancele a qualquer momento, sem multa",
        "Pagamento seguro via Mercado Pago",
        "Suporte por e-mail e WhatsApp",
    ])


class FAQSection(BaseModel):
    enabled: bool = True
    title: str = "Ficou com alguma dúvida?"
    subtitle: str = "Entre em contato conosco."
    image: str = ""
    items: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "question": "O que é o SIMIDNAPE PRO?",
            "answer": "É um assistente pedagógico com 7 motores de inteligência artificial para professores e coordenadores da educação básica brasileira. Alinhado à BNCC e focado em resultados (SAEPI, IDEB, ENEM). O nome vem de Sistema Municipal Integral de Desenvolvimento da Neuroaprendizagem e Performance Educacional.",
        },
        {
            "question": "Preciso saber usar IA?",
            "answer": "Não. O sistema é guiado por perguntas simples. Você responde e a IA gera o conteúdo.",
        },
        {
            "question": "Funciona para Ensino Médio?",
            "answer": "Sim. O SIMIDNAPE PRO atende Educação Infantil, Ensino Fundamental e Ensino Médio, com categorias e competências específicas para cada etapa.",
        },
        {
            "question": "Como funciona o pagamento?",
            "answer": "Você pode assinar via Pix (instantâneo) ou cartão de crédito/débito. Começa com 5 créditos grátis. Depois escolhe o plano mensal (Básico, Padrão ou Avançado) ou compra créditos avulsos.",
        },
        {
            "question": "Posso cancelar quando quiser?",
            "answer": "Sim, sem burocracia. Basta clicar em 'Cancelar' na página Minha Assinatura.",
        },
        {
            "question": "Os materiais são alinhados à BNCC?",
            "answer": "Sim. Todas as gerações consideram habilidades BNCC específicas. E o Banco de Questões é 100% baseado em provas oficiais do ENEM.",
        },
    ])


class FinalCTASection(BaseModel):
    enabled: bool = True
    headline: str = "Torne-se O Professor Inesquecível na vida dos seus alunos."
    subheadline: str = "Comece agora com 5 créditos grátis. Sem cartão de crédito. Sem compromisso."
    cta_text: str = "Criar minha conta grátis"
    cta_link: str = "/register"


class FooterSection(BaseModel):
    enabled: bool = True
    copyright_text: str = "© 2025 SIMIDNAPE PRO — O Professor Inesquecível. Todos os direitos reservados."
    brand_explanation: str = (
        "SIMIDNAPE significa Sistema Municipal Integral de Desenvolvimento da "
        "Neuroaprendizagem e Performance Educacional."
    )
    links: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"label": "Sobre", "href": "/sobre"},
        {"label": "Termos de Uso", "href": "/termos"},
        {"label": "Privacidade", "href": "/privacidade"},
        {"label": "Contato", "href": "mailto:contato@simidnape.com.br"},
    ])


class PopupSection(BaseModel):
    enabled: bool = False
    title: str = "Oferta especial"
    message: str = "Ganhe 10 créditos bônus na primeira assinatura!"
    cta_text: str = "Ver planos"
    cta_link: str = "/register"
    delay_seconds: int = 5
    show_once_per_user: bool = True


# ============================================================
# SCHEMA PRINCIPAL
# ============================================================
class LandingConfigSchema(BaseModel):
    sections_order: List[str] = Field(default_factory=lambda: [
        "hero",
        "credibility",
        "problem",
        "solution",
        "founder",
        "video",
        "how_it_works",
        "metrics",
        "testimonials",
        "comparison",
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
    accent_color: str = "#7c3aed"

    hero: HeroSection = Field(default_factory=HeroSection)
    credibility: CredibilityBarSection = Field(default_factory=CredibilityBarSection)
    problem: ProblemSection = Field(default_factory=ProblemSection)
    solution: SolutionSection = Field(default_factory=SolutionSection)
    founder: FounderSection = Field(default_factory=FounderSection)
    video: VideoSection = Field(default_factory=VideoSection)
    how_it_works: HowItWorksSection = Field(default_factory=HowItWorksSection)
    metrics: MetricsSection = Field(default_factory=MetricsSection)
    testimonials: TestimonialsSection = Field(default_factory=TestimonialsSection)
    comparison: ComparisonSection = Field(default_factory=ComparisonSection)
    plans: PlansSection = Field(default_factory=PlansSection)
    guarantee: GuaranteeSection = Field(default_factory=GuaranteeSection)
    faq: FAQSection = Field(default_factory=FAQSection)
    final_cta: FinalCTASection = Field(default_factory=FinalCTASection)
    footer: FooterSection = Field(default_factory=FooterSection)
    popup: PopupSection = Field(default_factory=PopupSection)


class LandingConfigOut(BaseModel):
    id: UUID
    config: LandingConfigSchema
    updated_at: Optional[datetime]
    updated_by: Optional[UUID]

    class Config:
        from_attributes = True


def get_default_landing_config() -> dict:
    return LandingConfigSchema().model_dump()