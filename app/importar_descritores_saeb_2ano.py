"""
Importa descritores do SAEB 2º ano (LP e MA) para a tabela `descritores`.

Fonte: INEP — Matriz de Referência de LP e MAT do SAEB 2º ano do EF (2020/2025).

Rodar UMA VEZ. Idempotente.
"""
import os
import uuid
import psycopg2
from psycopg2.extras import execute_values


# ============================================================
# SAEB — LÍNGUA PORTUGUESA 2º ANO (H1 a H10)
# ============================================================
LP_SAEB_2 = [
    ("H1", "Relacionar elementos sonoros das palavras com sua representação escrita (consciência fonológica).", "Apropriação do sistema de escrita"),
    ("H2", "Ler palavras de forma isolada.", "Apropriação do sistema de escrita"),
    ("H3", "Escrever palavras respeitando as regras ortográficas basilares.", "Apropriação do sistema de escrita"),
    ("H4", "Ler frases conectadas.", "Leitura"),
    ("H5", "Localizar informações explícitas no corpo de textos curtos.", "Leitura"),
    ("H6", "Reconhecer qual é a finalidade de um texto de gênero cotidiano (convite, receita, aviso).", "Leitura"),
    ("H7", "Inferir o assunto ou tema principal tratado no texto.", "Leitura"),
    ("H8", "Inferir informações implícitas em textos puramente verbais.", "Leitura"),
    ("H9", "Inferir informações em textos mistos (linguagem verbal e não verbal).", "Leitura"),
    ("H10", "Escrever um texto de acordo com uma proposta narrativa ou instrucional adequada à idade.", "Produção textual"),
]

# ============================================================
# SAEB — MATEMÁTICA 2º ANO (padrão 2[Eixo][Nível].[Ordem])
# ============================================================
MA_SAEB_2 = [
    # Números (N1 - Compreender e aplicar)
    ("2N1.1", "Reconhecer o que os números naturais indicam em diferentes situações: quantidade, ordem, medida ou código de identificação.", "Números"),
    ("2N1.2", "Reconhecer e utilizar as características do sistema de numeração decimal: base 10, valor posicional.", "Números"),
    ("2N1.3", "Ler, escrever e comparar números naturais de até três ordens.", "Números"),
    ("2N1.4", "Ordenar números naturais em sequências crescentes e decrescentes.", "Números"),
    ("2N1.5", "Identificar regularidades em sequências numéricas.", "Números"),
    ("2N1.6", "Compor e decompor números naturais de até três ordens.", "Números"),
    # Números (N2 - Resolver problemas)
    ("2N2.1", "Resolver problemas de adição e subtração com números naturais.", "Números"),
    ("2N2.2", "Resolver problemas de multiplicação e divisão simples com números naturais.", "Números"),
    # Álgebra (A)
    ("2A1.1", "Identificar padrões e regularidades em sequências de números ou figuras.", "Álgebra"),
    # Geometria (G)
    ("2G1.1", "Identificar a localização ou descrição do deslocamento de pessoas/objetos em representações bidimensionais.", "Geometria"),
    ("2G1.2", "Reconhecer figuras geométricas planas (círculo, quadrado, triângulo, retângulo) e espaciais.", "Geometria"),
    # Grandezas e Medidas (M)
    ("2M1.1", "Estimar e comparar comprimentos, massas e capacidades utilizando unidades não padronizadas.", "Grandezas e Medidas"),
    ("2M1.2", "Reconhecer e utilizar o Sistema Monetário Brasileiro em situações do cotidiano.", "Grandezas e Medidas"),
    ("2M1.3", "Ler horas em relógios digitais ou de ponteiros.", "Grandezas e Medidas"),
    # Probabilidade e Estatística (E)
    ("2E1.1", "Ler e interpretar informações apresentadas em tabelas simples.", "Probabilidade e Estatística"),
    ("2E1.2", "Ler e interpretar informações apresentadas em gráficos de colunas simples.", "Probabilidade e Estatística"),
]


def montar_registros():
    todos = []

    def _add(componente, area, codigo, texto, tema):
        todos.append((
            str(uuid.uuid4()),
            "saeb",
            componente,
            area,
            "EF",
            2,
            codigo,
            texto,
            tema,
            True,
        ))

    for codigo, texto, tema in LP_SAEB_2:
        _add("LP", "Língua Portuguesa", codigo, texto, tema)

    for codigo, texto, tema in MA_SAEB_2:
        _add("MA", "Matemática", codigo, texto, tema)

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
            SELECT fonte, componente, ano, COUNT(*)
            FROM descritores
            WHERE ano = 2
            GROUP BY fonte, componente, ano
            ORDER BY fonte, componente
        """)
        dist_2ano = cur.fetchall()

        cur.close()
        print(f"\n✅ Total na tabela descritores: {total}")
        print("\nDescritores do 2º ano:")
        for fonte, comp, ano, qtd in dist_2ano:
            print(f"  {fonte:5} | {comp} | {ano}º ano → {qtd}")
    finally:
        conn.close()


def main():
    print("=" * 60)
    print("  IMPORTAÇÃO DE DESCRITORES SAEB 2º ANO")
    print("=" * 60)
    registros = montar_registros()
    print(f"\n📊 Total a importar: {len(registros)}")
    inserir(registros)
    print("\n" + "=" * 60)
    print("✅ Concluído!")
    print("=" * 60)


if __name__ == "__main__":
    main()