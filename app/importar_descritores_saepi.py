"""
Importa descritores do SAEPI (LP e MA) para a tabela `descritores`.

Fonte: SAEPI (CAEd/UFJF) — Matrizes de Referência oficiais.

Rodar UMA VEZ. Idempotente.
"""
import os
import uuid
import psycopg2
from psycopg2.extras import execute_values


# ============================================================
# SAEPI — LÍNGUA PORTUGUESA 2º ANO
# ============================================================
LP_SAEPI_2 = [
    ("D01", "Relacionar elementos sonoros das palavras com sua representação escrita.", "Apropriação do sistema de escrita"),
    ("D02", "Ler palavras.", "Apropriação do sistema de escrita"),
    ("D03", "Ler frases.", "Apropriação do sistema de escrita"),
    ("D04", "Localizar informações explícitas em textos.", "Leitura"),
    ("D05", "Reconhecer a finalidade de um texto.", "Leitura"),
    ("D06", "Inferir o assunto de um texto.", "Leitura"),
    ("D07", "Inferir informações em textos verbais.", "Leitura"),
    ("D08", "Inferir informações em textos que articulam linguagem verbal e não verbal.", "Leitura"),
    ("D09", "Escrever palavras (Item de resposta construída).", "Produção textual"),
    ("D10", "Escrever textos (Item de resposta construída).", "Produção textual"),
]

# ============================================================
# SAEPI — LÍNGUA PORTUGUESA 3º AO 9º ANO
# ============================================================
LP_SAEPI_3_9 = [
    ("D01", "Localizar informações explícitas em um texto.", "Procedimentos de leitura", [3,4,5,6,7,8,9]),
    ("D02", "Estabelecer relações entre partes de um texto, identificando repetições ou substituições que contribuem para sua continuidade.", "Coerência e coesão", [3,4,5,6,7,8,9]),
    ("D03", "Inferir o sentido de uma palavra ou expressão com base no seu contexto de uso.", "Procedimentos de leitura", [3,4,5,6,7,8,9]),
    ("D04", "Inferir uma informação implícita em um texto.", "Procedimentos de leitura", [3,4,5,6,7,8,9]),
    ("D05", "Interpretar texto com auxílio de material gráfico diverso (propagandas, quadrinhos, fotos, infográficos).", "Implicações do suporte", [3,4,5,6,7,8,9]),
    ("D06", "Identificar o tema ou assunto principal de um texto.", "Procedimentos de leitura", [3,4,5,6,7,8,9]),
    ("D07", "Estabelecer relações de causa e consequência entre partes e blocos de um texto.", "Coerência e coesão", [3,4,5,6,7,8,9]),
    ("D08", "Estabelecer relação entre partes de um texto, identificando o efeito de sentido gerado por elementos de coesão (conjunções, advérbios).", "Coerência e coesão", [3,4,5,6,7,8,9]),
    ("D10", "Identificar o conflito gerador do enredo e os elementos que constroem a narrativa (tempo, espaço, personagens).", "Coerência e coesão", [6,7,8,9]),
    ("D12", "Identificar a finalidade de textos de diferentes gêneros circulantes na sociedade.", "Implicações do suporte", [3,4,5,6,7,8,9]),
    ("D14", "Distinguir um fato da opinião expressa e relativa a esse fato.", "Procedimentos de leitura", [3,4,5,6,7,8,9]),
    ("D16", "Identificar efeitos de ironia ou humor em textos variados.", "Recursos expressivos", [3,4,5,6,7,8,9]),
    ("D17", "Reconhecer o efeito de sentido decorrente do uso de uma determinada palavra, pontuação ou expressão estilística.", "Recursos expressivos", [3,4,5,6,7,8,9]),
    ("D20", "Reconhecer diferentes formas de tratar uma informação na comparação de textos que versam sobre o mesmo tema.", "Relação entre textos", [3,4,5,6,7,8,9]),
]

# ============================================================
# SAEPI — MATEMÁTICA 2º AO 9º ANO
# ============================================================
MA_SAEPI = [
    ("D01", "Identificar a localização ou movimentação de objetos em mapas, croquis e representações espaciais.", "Espaço e Forma"),
    ("D02", "Identificar propriedades comuns e diferenças entre poliedros e corpos redondos, associando-os às suas planificações.", "Espaço e Forma"),
    ("D03", "Identificar propriedades e diferenças entre figuras bidimensionais de acordo com o número de lados e tipos de ângulos.", "Espaço e Forma"),
    ("D04", "Reconhecer a simetria reflexiva ou posições relativas entre retas paralelas e perpendiculares.", "Espaço e Forma"),
    ("D05", "Reconhecer a conservação ou modificação de medidas dos lados, do perímetro e da área na ampliação e/ou redução de figuras em malhas quadriculadas.", "Espaço e Forma"),
    ("D06", "Estimar a medida de grandezas utilizando unidades de medida não convencionais ou convencionais padronizadas.", "Grandezas e Medidas"),
    ("D07", "Resolver problemas significativos utilizando unidades de medida padronizadas (comprimento, massa, capacidade).", "Grandezas e Medidas"),
    ("D08", "Ler horas em relógios digitais ou de ponteiros e calcular intervalos ou duração de tempo.", "Grandezas e Medidas"),
    ("D09", "Resolver problema envolvendo o cálculo do perímetro de figuras planas.", "Grandezas e Medidas"),
    ("D10", "Resolver problema envolvendo o cálculo ou a estimativa de áreas de figuras planas.", "Grandezas e Medidas"),
    ("D11", "Resolver problemas que envolvam o Sistema Monetário Brasileiro (operações com cédulas, moedas e troco).", "Grandezas e Medidas"),
    ("D12", "Reconhecer e utilizar as características do sistema de numeração decimal (composição, decomposição e valor posicional).", "Números e Operações"),
    ("D13", "Reconhecer a posição de números naturais, inteiros ou racionais na reta numérica.", "Números e Operações"),
    ("D14", "Resolver problemas com números naturais que envolvam diferentes significados das operações (adição, subtração, multiplicação e divisão).", "Números e Operações"),
    ("D15", "Reconhecer diferentes representações de um mesmo número racional (fração, escrita decimal e percentual).", "Números e Operações"),
    ("D22", "Resolver problema utilizando a escrita decimal ou fracionária de números racionais.", "Números e Operações"),
    ("D26", "Resolver problemas que envolvam noções ou cálculos simples de porcentagem (25%, 50%, 100%).", "Números e Operações"),
    ("D27", "Ler e interpretar informações e dados estruturados e apresentados em tabelas simples ou de dupla entrada.", "Tratamento da Informação"),
    ("D28", "Ler e interpretar informações organizadas e expostas em gráficos (colunas, barras, linhas ou setores).", "Tratamento da Informação"),
    ("D29", "Resolver problemas que envolvam a variação de proporcionalidade direta ou inversa entre grandezas.", "Números e Operações"),
]


def montar_registros():
    todos = []

    def _add(componente, area, ano, codigo, texto, tema):
        todos.append((
            str(uuid.uuid4()),
            "saepi",
            componente,
            area,
            "EF",
            ano,
            codigo,
            texto,
            tema,
            True,
        ))

    # LP 2º ano
    for codigo, texto, tema in LP_SAEPI_2:
        _add("LP", "Língua Portuguesa", 2, codigo, texto, tema)

    # LP 3º ao 9º ano
    for codigo, texto, tema, anos in LP_SAEPI_3_9:
        for ano in anos:
            _add("LP", "Língua Portuguesa", ano, codigo, texto, tema)

    # MA 2º ao 9º ano
    for codigo, texto, tema in MA_SAEPI:
        for ano in range(2, 10):
            _add("MA", "Matemática", ano, codigo, texto, tema)

    return todos


def inserir(registros):
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERRO: DATABASE_URL não definida.")
        return
    conn = psycopg2.connect(url)
    try:
        cur = conn.cursor()
        query = """
            INSERT INTO descritores
                (id, fonte, componente, area, etapa, ano, codigo, texto, tema, ativo)
            VALUES %s
            ON CONFLICT (fonte, componente, ano, codigo)
            DO UPDATE SET texto = EXCLUDED.texto, tema = EXCLUDED.tema
        """
        execute_values(cur, query, registros)
        conn.commit()

        cur.execute("SELECT COUNT(*) FROM descritores")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT fonte, componente, COUNT(*)
            FROM descritores
            GROUP BY fonte, componente
            ORDER BY fonte, componente
        """)
        dist = cur.fetchall()

        cur.close()
        print(f"\n✅ Total na tabela descritores: {total}")
        print("\nDistribuição:")
        for fonte, comp, qtd in dist:
            print(f"  {fonte:5} | {comp} → {qtd}")
    finally:
        conn.close()


def main():
    print("=" * 60)
    print("  IMPORTAÇÃO DE DESCRITORES SAEPI")
    print("=" * 60)
    registros = montar_registros()
    print(f"\n📊 Total a importar: {len(registros)}")
    inserir(registros)
    print("\n" + "=" * 60)
    print("✅ Concluído!")
    print("=" * 60)


if __name__ == "__main__":
    main()