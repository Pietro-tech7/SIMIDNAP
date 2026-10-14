"""
Importa os descritores oficiais do SAEB (INEP) para as tabelas.
Matemática e Língua Portuguesa — 5º e 9º anos do Ensino Fundamental.

Fonte: Matrizes de Referência do SAEB (INEP).
Rodar UMA VEZ. Idempotente.
"""
import os
import uuid
import psycopg2
from psycopg2.extras import execute_values


# ============================================================
# MATEMÁTICA — 5º ANO (SAEB)
# ============================================================
MA_5 = [
    ("D01", "Identificar a localização/movimentação de objeto em mapas, croquis e outras representações gráficas.", "Espaço e forma"),
    ("D02", "Identificar propriedades comuns e diferenças entre poliedros e corpos redondos, relacionando figuras tridimensionais com suas planificações.", "Espaço e forma"),
    ("D03", "Identificar propriedades comuns e diferenças entre figuras bidimensionais pelo número de lados, pelos tipos de ângulos.", "Espaço e forma"),
    ("D04", "Identificar quadriláteros observando as posições relativas entre seus lados.", "Espaço e forma"),
    ("D05", "Reconhecer a conservação ou modificação de medidas dos lados, do perímetro, da área em ampliação e/ou redução de figuras poligonais usando malhas quadriculadas.", "Espaço e forma"),
    ("D06", "Estimar a medida de grandezas utilizando unidades de medida convencionais ou não.", "Grandezas e medidas"),
    ("D07", "Resolver problemas significativos utilizando unidades de medida padronizadas como km/m/cm/mm, kg/g/mg, L/mL.", "Grandezas e medidas"),
    ("D08", "Estabelecer relações entre unidades de medida de tempo.", "Grandezas e medidas"),
    ("D09", "Estabelecer relações entre o horário de início e término e/ou o intervalo da duração de um evento ou acontecimento.", "Grandezas e medidas"),
    ("D10", "Num problema, estabelecer trocas entre cédulas e moedas do sistema monetário brasileiro, em função de seus valores.", "Grandezas e medidas"),
    ("D11", "Resolver problema envolvendo o cálculo do perímetro de figuras planas, desenhadas em malhas quadriculadas.", "Grandezas e medidas"),
    ("D12", "Resolver problema envolvendo o cálculo ou estimativa de áreas de figuras planas, desenhadas em malhas quadriculadas.", "Grandezas e medidas"),
    ("D13", "Reconhecer e utilizar características do sistema de numeração decimal, tais como agrupamentos e trocas na base 10 e princípio do valor posicional.", "Números e operações"),
    ("D14", "Identificar a localização de números naturais na reta numérica.", "Números e operações"),
    ("D15", "Reconhecer a decomposição de números naturais nas suas diversas ordens.", "Números e operações"),
    ("D16", "Reconhecer a composição e a decomposição de números naturais em sua forma polinomial.", "Números e operações"),
    ("D17", "Calcular o resultado de uma adição ou subtração de números naturais.", "Números e operações"),
    ("D18", "Calcular o resultado de uma multiplicação ou divisão de números naturais.", "Números e operações"),
    ("D19", "Resolver problema com números naturais, envolvendo diferentes significados da adição ou subtração: juntar, alteração de um estado inicial, comparar.", "Números e operações"),
    ("D20", "Resolver problema com números naturais, envolvendo diferentes significados da multiplicação ou divisão: multiplicação comparativa, ideia de proporcionalidade, configuração retangular e combinatória.", "Números e operações"),
    ("D21", "Identificar diferentes representações de um mesmo número racional.", "Números e operações"),
    ("D22", "Identificar a localização de números racionais representados na forma decimal na reta numérica.", "Números e operações"),
    ("D23", "Resolver problema utilizando a escrita decimal de cédulas e moedas do sistema monetário brasileiro.", "Números e operações"),
    ("D24", "Identificar fração como representação que pode estar associada a diferentes significados.", "Números e operações"),
    ("D25", "Resolver problema com números racionais expressos na forma decimal envolvendo diferentes significados da adição ou subtração.", "Números e operações"),
    ("D26", "Resolver problema envolvendo noções de porcentagem (25%, 50%, 100%).", "Números e operações"),
    ("D27", "Ler informações e dados apresentados em tabelas.", "Tratamento da informação"),
    ("D28", "Ler informações e dados apresentados em gráficos (particularmente em gráficos de colunas).", "Tratamento da informação"),
]

# ============================================================
# MATEMÁTICA — 9º ANO (SAEB)
# ============================================================
MA_9 = [
    ("D01", "Identificar a localização/movimentação de objeto em mapas, croquis e outras representações gráficas.", "Espaço e forma"),
    ("D02", "Identificar propriedades comuns e diferenças entre figuras bidimensionais e tridimensionais, relacionando-as com as suas planificações.", "Espaço e forma"),
    ("D03", "Identificar propriedades de triângulos pela comparação de medidas de lados e ângulos.", "Espaço e forma"),
    ("D04", "Identificar relação entre quadriláteros por meio de suas propriedades.", "Espaço e forma"),
    ("D05", "Reconhecer a conservação ou modificação de medidas dos lados, do perímetro, da área em ampliação e/ou redução de figuras poligonais usando malhas quadriculadas.", "Espaço e forma"),
    ("D06", "Reconhecer ângulos como mudança de direção ou giros, identificando ângulos retos e não retos.", "Espaço e forma"),
    ("D07", "Reconhecer que as imagens de uma figura construída por uma transformação homotética são semelhantes, identificando propriedades e/ou medidas que se modificam ou não se alteram.", "Espaço e forma"),
    ("D08", "Resolver problema utilizando propriedades dos polígonos (soma de seus ângulos internos, número de diagonais, cálculo da medida de cada ângulo interno nos polígonos regulares).", "Espaço e forma"),
    ("D09", "Interpretar informações obtidas por meio de coordenadas cartesianas em situações problema.", "Espaço e forma"),
    ("D10", "Utilizar relações métricas do triângulo retângulo para resolver problemas significativos.", "Espaço e forma"),
    ("D11", "Reconhecer círculo/circunferência, seus elementos e algumas de suas relações.", "Espaço e forma"),
    ("D12", "Resolver problema envolvendo o cálculo de perímetro de figuras planas.", "Grandezas e medidas"),
    ("D13", "Resolver problema envolvendo o cálculo de área de figuras planas.", "Grandezas e medidas"),
    ("D14", "Resolver problema envolvendo noções de volume.", "Grandezas e medidas"),
    ("D15", "Resolver problema utilizando relações entre diferentes unidades de medida.", "Grandezas e medidas"),
    ("D16", "Identificar a localização de números inteiros na reta numérica.", "Números e operações"),
    ("D17", "Identificar a localização de números racionais na reta numérica.", "Números e operações"),
    ("D18", "Efetuar cálculos com números inteiros, envolvendo as operações (adição, subtração, multiplicação, divisão, potenciação).", "Números e operações"),
    ("D19", "Resolver problema com números naturais, envolvendo diferentes significados das operações (adição, subtração, multiplicação, divisão, potenciação).", "Números e operações"),
    ("D20", "Resolver problema com números inteiros envolvendo as operações (adição, subtração, multiplicação, divisão, potenciação).", "Números e operações"),
    ("D21", "Reconhecer as diferentes representações de um número racional.", "Números e operações"),
    ("D22", "Identificar fração como representação que pode estar associada a diferentes significados.", "Números e operações"),
    ("D23", "Identificar frações equivalentes.", "Números e operações"),
    ("D24", "Reconhecer as representações decimais dos números racionais como uma extensão do sistema de numeração decimal identificando a existência de \"ordens\" como décimos, centésimos e milésimos.", "Números e operações"),
    ("D25", "Efetuar cálculos que envolvam operações com números racionais (adição, subtração, multiplicação, divisão, potenciação).", "Números e operações"),
    ("D26", "Resolver problema com números racionais envolvendo as operações (adição, subtração, multiplicação, divisão, potenciação).", "Números e operações"),
    ("D27", "Efetuar cálculos simples com valores aproximados de radicais.", "Números e operações"),
    ("D28", "Resolver problema que envolva porcentagem.", "Números e operações"),
    ("D29", "Resolver problema que envolva variação proporcional, direta ou inversa, entre grandezas.", "Números e operações"),
    ("D30", "Calcular o valor numérico de uma expressão algébrica.", "Álgebra e funções"),
    ("D31", "Resolver problema que envolva equação de segundo grau.", "Álgebra e funções"),
    ("D32", "Identificar a expressão algébrica que expressa uma regularidade observada em sequências de números ou figuras (padrões).", "Álgebra e funções"),
    ("D33", "Identificar uma equação ou uma inequação de primeiro grau que expressa um problema.", "Álgebra e funções"),
    ("D34", "Identificar um sistema de equações do primeiro grau que expressa um problema.", "Álgebra e funções"),
    ("D35", "Identificar a relação entre as representações algébrica e geométrica de um sistema de equações de primeiro grau.", "Álgebra e funções"),
    ("D36", "Resolver problema envolvendo informações apresentadas em tabelas e/ou gráficos.", "Tratamento da informação"),
    ("D37", "Associar informações apresentadas em listas e/ou tabelas simples aos gráficos que as representam e vice-versa.", "Tratamento da informação"),
]

# ============================================================
# LÍNGUA PORTUGUESA — 5º ANO (SAEB)
# ============================================================
LP_5 = [
    ("D01", "Localizar informações explícitas em um texto.", "Procedimentos de leitura"),
    ("D02", "Estabelecer relações entre partes de um texto, identificando repetições ou substituições que contribuem para a continuidade de um texto.", "Procedimentos de leitura"),
    ("D03", "Inferir o sentido de uma palavra ou expressão.", "Procedimentos de leitura"),
    ("D04", "Inferir uma informação implícita em um texto.", "Procedimentos de leitura"),
    ("D05", "Interpretar texto com auxílio de material gráfico diverso (propagandas, quadrinhos, foto, etc.).", "Procedimentos de leitura"),
    ("D06", "Identificar o tema de um texto.", "Procedimentos de leitura"),
    ("D07", "Identificar a tese de um texto.", "Procedimentos de leitura"),
    ("D08", "Estabelecer relação entre a tese e os argumentos oferecidos para sustentá-la.", "Procedimentos de leitura"),
    ("D09", "Diferenciar as partes principais das secundárias em um texto.", "Procedimentos de leitura"),
    ("D10", "Identificar o conflito gerador do enredo e os elementos que constroem a narrativa.", "Procedimentos de leitura"),
    ("D11", "Estabelecer relação causa/consequência entre partes e elementos do texto.", "Procedimentos de leitura"),
    ("D12", "Identificar a finalidade de textos de diferentes gêneros.", "Procedimentos de leitura"),
    ("D13", "Identificar as marcas linguísticas que evidenciam o locutor e o interlocutor de um texto.", "Procedimentos de leitura"),
    ("D14", "Distinguir um fato da opinião relativa a esse fato.", "Procedimentos de leitura"),
    ("D15", "Reconhecer diferentes formas de tratar uma informação na comparação de textos que tratam do mesmo tema.", "Procedimentos de leitura"),
]

# ============================================================
# LÍNGUA PORTUGUESA — 9º ANO (SAEB)
# ============================================================
LP_9 = [
    ("D01", "Localizar informações explícitas em um texto.", "Procedimentos de leitura"),
    ("D02", "Estabelecer relações entre partes de um texto, identificando repetições ou substituições que contribuem para a continuidade de um texto.", "Procedimentos de leitura"),
    ("D03", "Inferir o sentido de uma palavra ou expressão.", "Procedimentos de leitura"),
    ("D04", "Inferir uma informação implícita em um texto.", "Procedimentos de leitura"),
    ("D05", "Interpretar texto com auxílio de material gráfico diverso (propagandas, quadrinhos, foto, etc.).", "Procedimentos de leitura"),
    ("D06", "Identificar o tema de um texto.", "Procedimentos de leitura"),
    ("D07", "Identificar a tese de um texto.", "Procedimentos de leitura"),
    ("D08", "Estabelecer relação entre a tese e os argumentos oferecidos para sustentá-la.", "Procedimentos de leitura"),
    ("D09", "Diferenciar as partes principais das secundárias em um texto.", "Procedimentos de leitura"),
    ("D10", "Identificar o conflito gerador do enredo e os elementos que constroem a narrativa.", "Procedimentos de leitura"),
    ("D11", "Estabelecer relação causa/consequência entre partes e elementos do texto.", "Procedimentos de leitura"),
    ("D12", "Identificar a finalidade de textos de diferentes gêneros.", "Procedimentos de leitura"),
    ("D13", "Identificar as marcas linguísticas que evidenciam o locutor e o interlocutor de um texto.", "Procedimentos de leitura"),
    ("D14", "Distinguir um fato da opinião relativa a esse fato.", "Procedimentos de leitura"),
    ("D15", "Reconhecer diferentes formas de tratar uma informação na comparação de textos que tratam do mesmo tema.", "Procedimentos de leitura"),
]


# ============================================================
# CONSOLIDAÇÃO
# ============================================================
def montar_registros():
    """Retorna todos os descritores como tuplas prontas para o INSERT."""
    todos = []

    def _add(fonte, componente, area, etapa, ano, lista):
        for codigo, texto, tema in lista:
            todos.append((
                str(uuid.uuid4()),
                fonte,
                componente,
                area,
                etapa,
                ano,
                codigo,
                texto,
                tema,
                True,
            ))

    # SAEB — Matemática
    _add("saeb", "MA", "Matemática", "EF", 5, MA_5)
    _add("saeb", "MA", "Matemática", "EF", 9, MA_9)

    # SAEB — Língua Portuguesa
    _add("saeb", "LP", "Língua Portuguesa", "EF", 5, LP_5)
    _add("saeb", "LP", "Língua Portuguesa", "EF", 9, LP_9)

    return todos


# ============================================================
# INSERÇÃO
# ============================================================
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
            DO UPDATE SET
                texto = EXCLUDED.texto,
                tema = EXCLUDED.tema,
                area = EXCLUDED.area
        """

        execute_values(cur, query, registros)
        conn.commit()

        # Estatísticas
        cur.execute("SELECT COUNT(*) FROM descritores")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT fonte, componente, ano, COUNT(*)
            FROM descritores
            GROUP BY fonte, componente, ano
            ORDER BY fonte, componente, ano
        """)
        por_grupo = cur.fetchall()

        cur.close()

        print(f"\n✅ Total na tabela descritores: {total}")
        print("\nDistribuição:")
        for fonte, comp, ano, qtd in por_grupo:
            print(f"  {fonte:5} | {comp} | {ano}º ano → {qtd} descritores")

    finally:
        conn.close()


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("  IMPORTAÇÃO DE DESCRITORES SAEB")
    print("=" * 60)

    registros = montar_registros()
    print(f"\n📊 Total de descritores a importar: {len(registros)}")

    print("\n💾 Inserindo no banco...")
    inserir(registros)

    print("\n" + "=" * 60)
    print("✅ Importação concluída!")
    print("=" * 60)


if __name__ == "__main__":
    main()