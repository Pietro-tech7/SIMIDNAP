"""
Schemas do Motor 9 — Banco de Questões IA.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ============================================================
# REQUISIÇÃO
# ============================================================
class HabilidadeRequest(BaseModel):
    """Uma habilidade selecionada pelo professor."""
    codigo: str = Field(..., description="Código da habilidade (ex: EF02MA01)")
    texto: Optional[str] = Field(None, description="Texto da habilidade (opcional)")
    complemento_pi: Optional[str] = Field(None, description="Complemento do Currículo do Piauí (opcional)")
    unidade_tematica: Optional[str] = Field(None, description="Unidade Temática da BNCC")
    objeto_conhecimento: Optional[str] = Field(None, description="Objeto de Conhecimento da BNCC")
    descritores: List[str] = Field(default_factory=list, description="Lista de descritores (ex: ['D01','D05'])")
    nivel_cognitivo: Optional[str] = Field("Aplicar", description="Lembrar | Compreender | Aplicar | Analisar | Avaliar | Criar")
    dificuldade: Optional[str] = Field(None, description="'facil' | 'media' | 'dificil'")
    quantidade: int = Field(..., ge=1, le=20, description="Quantas questões gerar para esta habilidade")


class GerarQuestoesIARequest(BaseModel):
    """Payload completo para gerar questões com IA."""
    titulo: str = Field(..., max_length=200)
    etapa: str = Field(..., description="'EI' ou 'EF'")
    ano: Optional[int] = Field(None, ge=1, le=9)
    serie: Optional[str] = Field(None, max_length=50)
    componente: str = Field(..., description="MA, LP, HI, GE, CI, AR, EF, ER, LI, CO")
    disciplina_nome: Optional[str] = Field(None, max_length=100)

    # Campo antigo (retrocompatibilidade) — string única
    referencial: str = Field("bncc", description="'bncc' | 'curriculo_piaui' | 'saeb' | 'saepi' | 'ppaic'")

    # NOVO: multi-seleção de referenciais
    referenciais: Optional[List[str]] = Field(
        None,
        description="Lista de referenciais ativos (ex: ['bncc', 'saeb', 'curriculo_piaui']). "
                    "Se não informado, usa o campo `referencial`.",
    )

    estado: Optional[str] = Field(None, description="UF do professor (ex: 'PI')")
    incluir_ilustracoes: bool = Field(True)
    compartilhar_curadoria: bool = Field(False)
    dificuldade_padrao: Optional[str] = Field(None, description="'facil' | 'media' | 'dificil'")
    habilidades: List[HabilidadeRequest] = Field(..., min_items=1, max_items=10)


# ============================================================
# RESPOSTA — QUESTÃO GERADA
# ============================================================
class AlternativaIA(BaseModel):
    letra: str
    texto: str


# ============================================================
# BLOCO G — GRÁFICOS GERADOS POR IA (FASE 1: SCHEMA)
# ============================================================
class DadoGrafico(BaseModel):
    """Um par rótulo/valor do gráfico."""
    rotulo: str
    valor: float


class GraficoIA(BaseModel):
    """
    Dados estruturados de um gráfico gerado pela IA.
    A IA NÃO desenha — apenas devolve os dados.
    O frontend desenha (Recharts), e o PDF/Word capturam como imagem.
    """
    tipo: str = Field(..., description="'barras' | 'barras_horizontais' | 'linha' | 'pizza'")
    titulo: Optional[str] = None
    eixo_x: Optional[str] = None
    eixo_y: Optional[str] = None
    unidade: Optional[str] = None
    dados: List[DadoGrafico] = Field(default_factory=list)


class QuestaoIA(BaseModel):
    numero: int
    habilidade_codigo: str
    habilidade_texto: Optional[str] = None
    unidade_tematica: Optional[str] = None
    objeto_conhecimento: Optional[str] = None
    descritor: Optional[str] = None
    descritor_texto: Optional[str] = None
    nivel_cognitivo: Optional[str] = None
    dificuldade: Optional[str] = None
    tipo: str = "multipla_escolha"
    enunciado: str
    alternativas: List[AlternativaIA] = Field(default_factory=list)
    gabarito: str
    explicacao_gabarito: Optional[str] = None
    precisa_ilustracao: bool = False
    descricao_ilustracao: Optional[str] = None
    icone_sugerido: Optional[str] = None
    imagem_url: Optional[str] = None
    origem: str = "gerada_ia"

    # NOVOS CAMPOS — Fase 2
    tema_condutor: Optional[str] = None
    # Rótulo pedagógico da questão (ex: "QUANTIDADE", "ORDEM", "MEDIDA", "INFERIR", "LOCALIZAR").
    # Usado no PDF (Fase 4) e no filtro de SVGs (Fase 3).

    tipo_figura_sugerida: Optional[str] = None
    # Categoria pedagógica de figura (ex: "quantidade", "ordem", "medida",
    # "decomposicao", "sequencia", "comparacao", "objetos_escolares", "formas", "nenhuma").
    # Usado no frontend para sugerir SVGs ao professor (Fase 3).

    # BLOCO G — Gráficos gerados por IA
    grafico: Optional[GraficoIA] = None
    # Quando a questão for de interpretação de gráfico/dados, a IA preenche este
    # campo com dados estruturados. O sistema desenha o gráfico na tela, no PDF
    # e no Word. Se for None, a questão é textual normalmente.


class GerarQuestoesIAResponse(BaseModel):
    """Resultado da geração com IA."""
    sucesso: bool
    mensagem: Optional[str] = None
    total_questoes: int = 0
    questoes: List[QuestaoIA] = Field(default_factory=list)
    creditos_consumidos: float = 0.0
    metadados: Optional[Dict[str, Any]] = None