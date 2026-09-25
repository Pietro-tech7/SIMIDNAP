"""
Correlaciona habilidades BNCC com descritores SAEB via similaridade textual.

Estratégia:
1. Filtra skills do mesmo componente (MA / LP)
2. Filtra pelo mesmo ano (5º SAEB → 5º BNCC; 9º SAEB → 9º BNCC)
3. Calcula similaridade de palavras-chave (Jaccard)
4. Aplica bônus se o tema/unidade temática for compatível
5. Ordena por score, mantém top 5
6. Marca confiança: alta (>0.18), media (>0.10), baixa

Rodar UMA VEZ. Idempotente.
"""
import os
import re
import uuid
import psycopg2
from psycopg2.extras import execute_values
from collections import Counter


# ============================================================
# STOPWORDS PORTUGUESAS
# ============================================================
STOPWORDS = set("""
a ao aos aquela aquelas aquele aqueles aquilo as até com como da das de dela delas
dele deles depois do dos e ela elas ele eles em entre era eram essa essas esse
esses esta estas este estes eu foi foram há isso isto já lhe lhes mais mas me
mesmo meu meus minha minhas muito na nas não no nos nós o os ou para pela pelas
pelo pelos por qual quando que quem se sem seu seus sua suas são só também te
tem tendo ter teu teus tua tuas um uma umas uns você vocês é são ser estar
pode podem poderá deverá deve devem sobre sob entre através
""".split())


# ============================================================
# COMPATIBILIDADE TEMA (descritor) → UNIDADE (BNCC)
# ============================================================
TEMAS_PARA_UNIDADES = {
    "MA": {
        "Números e operações": ["Números", "Álgebra"],
        "Álgebra e funções": ["Álgebra", "Números"],
        "Espaço e forma": ["Geometria"],
        "Grandezas e medidas": ["Grandezas e medidas"],
        "Tratamento da informação": ["Probabilidade e estatística"],
    },
    "LP": {
        "Procedimentos de leitura": ["Leitura/escuta (compartilhada e autônoma)", "Todos os campos de atuação"],
    },
}


# ============================================================
# TOKENIZAÇÃO
# ============================================================
def tokenizar(texto: str) -> set:
    """Extrai palavras-chave (>= 4 letras, sem stopwords, sem acentos)."""
    if not texto:
        return set()
    # Normaliza
    texto = texto.lower()
    texto = re.sub(r"[^a-záéíóúâêôãõçà ]", " ", texto)
    # Remove acentos
    import unicodedata
    texto = unicodedata.normalize("NFD", texto).encode("ascii", "ignore").decode("utf-8")
    palavras = texto.split()
    return {p for p in palavras if len(p) >= 4 and p not in STOPWORDS}


def similaridade(texto1: str, texto2: str) -> float:
    """Jaccard similarity entre conjuntos de palavras."""
    k1 = tokenizar(texto1)
    k2 = tokenizar(texto2)
    if not k1 or not k2:
        return 0.0
    inter = len(k1 & k2)
    uniao = len(k1 | k2)
    return inter / uniao if uniao > 0 else 0.0


# ============================================================
# CLASSIFICAR CONFIANÇA
# ============================================================
def classificar_confianca(score: float, mesmo_tema: bool) -> str:
    if mesmo_tema and score >= 0.18:
        return "alta"
    if score >= 0.18:
        return "media"
    if score >= 0.10:
        return "media"
    return "baixa"


# ============================================================
# COMPATIBILIDADE DE TEMA
# ============================================================
def tema_compativel(componente: str, tema_descritor: str, unidade_skill: str) -> bool:
    if not tema_descritor or not unidade_skill:
        return False
    mapa = TEMAS_PARA_UNIDADES.get(componente, {})
    unidades_compativeis = mapa.get(tema_descritor, [])
    unidade_lower = unidade_skill.lower()
    return any(u.lower() in unidade_lower for u in unidades_compativeis)


# ============================================================
# CARREGAR DADOS
# ============================================================
def carregar_descritores(cur):
    cur.execute("""
        SELECT id, componente, ano, codigo, texto, tema
        FROM descritores
        WHERE ativo = TRUE
    """)
    return cur.fetchall()


def carregar_habilidades(cur, componente: str, ano: int):
    cur.execute("""
        SELECT habilidade_codigo, habilidade_texto, unidade_tematica, objeto_conhecimento
        FROM bncc_estrutura
        WHERE componente = %s AND ano = %s
    """, (componente, ano))
    return cur.fetchall()


# ============================================================
# CORRELACIONAR UM DESCRITOR
# ============================================================
def correlacionar_descritor(descritor, habilidades, top_n=5):
    """
    descritor = (id, componente, ano, codigo, texto, tema)
    habilidades = [(codigo, texto, unidade, objeto), ...]
    Retorna lista de (descritor_id, habilidade_codigo, score, mesmo_tema)
    """
    desc_id, componente, ano, cod_desc, texto_desc, tema_desc = descritor

    resultados = []
    for hab_codigo, hab_texto, unidade, objeto in habilidades:
        score = similaridade(texto_desc, hab_texto)
        # Bônus por unidade compatível
        mesmo_tema = tema_compativel(componente, tema_desc, unidade or "")
        if mesmo_tema:
            score *= 1.4  # bônus de 40%

        if score > 0.05:  # filtro mínimo
            resultados.append((desc_id, hab_codigo, score, mesmo_tema))

    # Ordena por score decrescente
    resultados.sort(key=lambda x: x[2], reverse=True)

    # Mantém top N
    return resultados[:top_n]


# ============================================================
# MAIN
# ============================================================
def main():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERRO: DATABASE_URL não definida.")
        return

    conn = psycopg2.connect(url)
    try:
        cur = conn.cursor()

        print("=" * 60)
        print("  CORRELAÇÃO HABILIDADE ↔ DESCRITOR (heurística)")
        print("=" * 60)

        # Carrega descritores
        descritores = carregar_descritores(cur)
        print(f"\n📊 Descritores carregados: {len(descritores)}")

        # Agrupa descritores por (componente, ano)
        cache_habilidades = {}
        correlacoes = []

        for desc in descritores:
            desc_id, componente, ano, cod_desc, texto_desc, tema = desc

            chave_cache = (componente, ano)
            if chave_cache not in cache_habilidades:
                cache_habilidades[chave_cache] = carregar_habilidades(cur, componente, ano)
                print(f"  Skills {componente} {ano}º ano: {len(cache_habilidades[chave_cache])}")

            habilidades = cache_habilidades[chave_cache]

            correl = correlacionar_descritor(desc, habilidades, top_n=5)

            for desc_id_r, hab_codigo, score, mesmo_tema in correl:
                confianca = classificar_confianca(score, mesmo_tema)
                correlacoes.append((
                    str(uuid.uuid4()),
                    hab_codigo,
                    desc_id_r,
                    confianca,
                    "heuristica",
                    False,
                ))

        print(f"\n📊 Total de correlações geradas: {len(correlacoes)}")

        # Insere no banco (ON CONFLICT para idempotência)
        query = """
            INSERT INTO habilidade_descritor
                (id, habilidade_codigo, descritor_id, confianca, fonte_correlacao, revisado)
            VALUES %s
            ON CONFLICT (habilidade_codigo, descritor_id)
            DO NOTHING
        """

        execute_values(cur, query, correlacoes)
        conn.commit()

        # Estatísticas
        cur.execute("SELECT COUNT(*) FROM habilidade_descritor")
        total = cur.fetchone()[0]

        cur.execute("""
            SELECT confianca, COUNT(*)
            FROM habilidade_descritor
            GROUP BY confianca
            ORDER BY confianca
        """)
        por_conf = cur.fetchall()

        cur.close()

        print(f"\n✅ Total na tabela habilidade_descritor: {total}")
        print("\nPor confiança:")
        for conf, qtd in por_conf:
            print(f"  {conf}: {qtd}")

    finally:
        conn.close()

    print("\n" + "=" * 60)
    print("✅ Correlação concluída!")
    print("=" * 60)


if __name__ == "__main__":
    main()