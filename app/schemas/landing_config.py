from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# BLOCOS DA LANDING (cada seção tem seu próprio schema)
# ============================================================

class HeroSection(BaseModel):
    enabled: bool = True
    badge: str = "Novo: Banco de Questões ENEM"
    headline: str = "O assistente pedagógico com IA que devolve seu tempo e melhora seus resultados."
    subheadline: str = (
        "7 motores de IA para planejar aulas, gerar materiais, criar práticas exitosas "
        "e preparar simulados — tudo alinhado à BNCC e focado em SAEPI, IDEB e ENEM."
    )
    cta_primary_text: str = "Criar conta grátis"
    cta_primary_link: str = "/register"
    cta_secondary_text: str = "Ver demonstração"
    cta_secondary_video_url: str = ""  # URL do vídeo (YouTube, Vimeo, mp4)
    video_enabled: bool = True
    video_url: str = ""  # Vídeo principal do hero
    metrics: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"value": "7", "label": "motores de IA"},
        {"value": "5", "label": "créditos grátis"},
        {"value": "0", "label": "cartão necessário"},
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
    subtitle: str = "O dia a dia do professor brasileiro é uma maratona."
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
    subtitle: str = "Cada motor resolve uma dor específica do professor. Todos alinhados à BNCC."
    motors: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "icon": "🧠",
            "name": "NeuroAula",
            "description": "Design de aprendizagem com base em neuroeducação.",
            "gradient": "from-purple-500 to-indigo-500",
        },
        {
            "icon": "❤️",
            "name": "Terapia Pedagógica",
            "description": "Espaço de escuta profissional para o professor.",
            "gradient": "from-pink-500 to-rose-500",
        },
        {
            "icon": "🎯",
            "name": "Aula que Funciona",
            "description": "Script cronometrado de execução em sala.",
            "gradient": "from-blue-500 to-cyan-500",
        },
        {
            "icon": "📊",
            "name": "Meu Aluno",
            "description": "Análise pedagógica de situações com alunos.",
            "gradient": "from-green-500 to-emerald-500",
        },
        {
            "icon": "📄",
            "name": "Gerador de Materiais",
            "description": "Atividades, jogos e simulados prontos.",
            "gradient": "from-orange-500 to-amber-500",
        },
        {
            "icon": "🏆",
            "name": "Práticas Exitosas",
            "description": "Crie, melhore ou documente práticas pedagógicas.",
            "gradient": "from-teal-500 to-cyan-600",
        },
        {
            "icon": "📚",
            "name": "Banco de Questões ENEM",
            "description": "3.000+ questões oficiais para montar simulados.",
            "gradient": "from-blue-600 to-indigo-700",
        },
    ])


class VideoSection(BaseModel):
    enabled: bool = True
    title: str = "Veja como funciona em 90 segundos"
    subtitle: str = "Um professor real conta como o SIMIDNAPE PRO mudou a rotina dele."
    video_url: str = ""  # YouTube embed, Vimeo, mp4, etc


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
    title: str = "O que os professores estão dizendo"
    testimonials: List[Dict[str, str]] = Field(default_factory=list)
    # Estrutura esperada:
    # [{"name": "Prof. X", "school": "Escola Y", "text": "...", "photo": "..."}]


class ComparisonSection(BaseModel):
    enabled: bool = True
    title: str = "Por que escolher o SIMIDNAPE PRO?"
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
    show_annual: bool = False  # futura opção de plano anual


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
    title: str = "Perguntas frequentes"
    items: List[Dict[str, str]] = Field(default_factory=lambda: [
        {
            "question": "O que é o SIMIDNAPE PRO?",
            "answer": "É um assistente pedagógico com 7 motores de inteligência artificial para professores e coordenadores da educação básica brasileira. Alinhado à BNCC e focado em resultados (SAEPI, IDEB, ENEM).",
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
            "answer": "Sim. Todas as gerações consideram habilidades BNCC específicas (você pode selecionar por componente e ano). E o Banco de Questões é 100% baseado em provas oficiais do ENEM.",
        },
    ])


class FinalCTASection(BaseModel):
    enabled: bool = True
    headline: str = "Comece agora com 5 créditos grátis"
    subheadline: str = "Sem cartão de crédito. Sem compromisso. Cancele quando quiser."
    cta_text: str = "Criar conta grátis"
    cta_link: str = "/register"


class FooterSection(BaseModel):
    enabled: bool = True
    copyright_text: str = "© 2025 SIMIDNAPE PRO. Todos os direitos reservados."
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
# SCHEMA PRINCIPAL (agrega todos os blocos)
# ============================================================
class LandingConfigSchema(BaseModel):
    # Ordem das seções na página
    sections_order: List[str] = Field(default_factory=lambda: [
        "hero",
        "credibility",
        "problem",
        "solution",
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

    # SEO
    seo_title: str = "SIMIDNAPE PRO — Assistente pedagógico com IA para professores"
    seo_description: str = (
        "7 motores de IA para planejar aulas, gerar materiais, criar práticas exitosas "
        "e preparar simulados do ENEM. Alinhado à BNCC. Comece grátis."
    )

    # Cores principais
    primary_color: str = "#2563eb"
    accent_color: str = "#7c3aed"

    # Blocos
    hero: HeroSection = Field(default_factory=HeroSection)
    credibility: CredibilityBarSection = Field(default_factory=CredibilityBarSection)
    problem: ProblemSection = Field(default_factory=ProblemSection)
    solution: SolutionSection = Field(default_factory=SolutionSection)
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


# ============================================================
# DEFAULT — usado quando não existe config no banco
# ============================================================
def get_default_landing_config() -> dict:
    """Retorna a configuração padrão da landing page."""
    return LandingConfigSchema().model_dump()