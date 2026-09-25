"""
Importa toda a estrutura curricular da BNCC para a tabela `bncc_estrutura`.

Correções aplicadas:
- Deduplicação antes do INSERT (a biblioteca retorna a mesma habilidade em vários anos)
- Educação Infantil agora usa o código do campo de experiência como componente
- NULLs convertidos para string vazia (Postgres não detecta unicidade com NULLs)

Rodar UMA VEZ. Idempotente.
"""
import os
import time
import psycopg2
from psycopg2.extras import execute_values
import uuid
import bncc


# ============================================================
# MAPA DE COMPONENTES DO ENSINO FUNDAMENTAL
# ============================================================
MAPA_COMPONENTES = {
    "Matemática": "MA",
    "Língua Portuguesa": "LP",
    "Ciências": "CI",
    "Geografia": "GE",
    "História": "HI",
    "Arte": "AR",
    "Educação Física": "EF",
    "Ensino Religioso": "ER",
    "Língua Inglesa": "LI",
    "Computação": "CO",
}

COMPONENTES_EF = ["MA", "LP", "CI", "GE", "HI", "AR", "EF", "ER", "LI"]

# (codigo_bncc_esperado_pela_lib, codigo_db, nome)
CAMPOS_EI = [
    ("EO", "EI_EO", "O eu, o outro e o nós"),
    ("CG", "EI_CG", "Corpo, gestos e movimentos"),
    ("TS", "EI_TS", "Traços, sons, cores e formas"),
    ("EF", "EI_EF", "Escuta, fala, pensamento e imaginação"),
    ("ET", "EI_ET", "Espaços, tempos, quantidades, relações e transformações"),
]


# ============================================================
# HEURÍSTICA DE DESCRITORES
# ============================================================
def tem_descritor(componente: str, ano) -> str:
    if componente in ("MA", "LP"):
        return "S"
    if componente in ("CI", "HI", "GE") and ano == 9:
        return "S"
    return "N"


# ============================================================
# NORMALIZAÇÃO
# ============================================================
def normalizar_habilidade(item: dict, force_componente: str = None) -> dict | None:
    """Extrai campos relevantes de uma habilidade. Retorna None se inválida."""
    codigo = item.get("codigo")
    texto = item.get("texto")
    etapa = item.get("etapa")
    if not codigo or not texto or not etapa:
        return None

    # Ano (primeiro da lista)
    anos = item.get("anos") or []
    ano = anos[0] if anos else None

    # Componente
    if force_componente:
        componente = force_componente
    else:
        componente_nome = (item.get("componente") or {}).get("nome", "")
        componente = MAPA_COMPONENTES.get(componente_nome)
        if not componente:
            return None

    # Organização
    org = item.get("organizacao") or {}
    tipo_org = org.get("tipo")
    nomes = org.get("nomes") or {}

    unidade = None
    prefixo_objeto = ""

    if tipo_org == "unidade_tematica":
        unidade = nomes.get("unidade_tematica")
    elif tipo_org == "campo_pratica":
        campos = nomes.get("campos_atuacao") or []
        unidade = " / ".join(campos) if campos else None
        pratica = nomes.get("pratica_linguagem")
        if pratica:
            prefixo_objeto = f"[{pratica}] "
    else:
        for k, v in nomes.items():
            if isinstance(v, str):
                unidade = v
                break

    # Objeto de conhecimento
    objetos = item.get("objetos_conhecimento") or []
    objetos_nomes = [o.get("nome") for o in objetos if o.get("nome")]
    objeto = " | ".join(objetos_nomes) if objetos_nomes else None

    if prefixo_objeto and objeto:
        objeto = f"{prefixo_objeto}{objeto}"
    elif prefixo_objeto:
        objeto = prefixo_objeto.strip()

    # Trunca
    if unidade and len(unidade) > 200:
        unidade = unidade[:197] + "..."
    if objeto and len(objeto) > 300:
        objeto = objeto[:297] + "..."

    # Converte None → "" para o INSERT não quebrar a unicidade
    return {
        "id": str(uuid.uuid4()),
        "etapa": etapa,
        "ano": ano,
        "componente": componente,
        "unidade_tematica": unidade or "",
        "objeto_conhecimento": objeto or "",
        "habilidade_codigo": codigo,
        "habilidade_texto": texto,
        "descritores_relacionados": None,
        "tem_descritor": tem_descritor(componente, ano),
        "referencial": "bncc",
        "complemento_pi": None,
    }


# ============================================================
# IMPORTAÇÃO POR ETAPA
# ============================================================
def importar_ef() -> list:
    todos = []
    for componente in COMPONENTES_EF:
        print(f"\n[EF] Processando componente: {componente}")
        for ano in range(1, 10):
            try:
                lista = bncc.habilidades_ef(componente=componente, ano=ano) or []
            except Exception as e:
                print(f"  Ano {ano}: erro -> {e}")
                continue

            for item in lista:
                norm = normalizar_habilidade(item)
                if norm:
                    todos.append(norm)

            print(f"  Ano {ano}: {len(lista)} habilidade(s)")
    return todos


def importar_ei() -> list:
    todos = []
    print("\n[EI] Processando Educação Infantil")
    for codigo_lib, codigo_db, _nome in CAMPOS_EI:
        try:
            lista = bncc.objetivos_ei(campo=codigo_lib) or []
        except Exception as e:
            print(f"  Campo {codigo_lib}: erro -> {e}")
            continue

        for item in lista:
            norm = normalizar_habilidade(item, force_componente=codigo_db)
            if norm:
                norm["etapa"] = "EI"
                norm["ano"] = None
                todos.append(norm)

        print(f"  Campo {codigo_lib} (salvo como {codigo_db}): {len(lista)} objetivo(s)")
    return todos


# ============================================================
# DEDUPLICAÇÃO
# ============================================================
def deduplicar(registros: list) -> list:
    """Remove duplicatas pela chave única da tabela."""
    vistos = set()
    saida = []
    for r in registros:
        chave = (
            r["referencial"],
            r["habilidade_codigo"],
            r["unidade_tematica"],
            r["objeto_conhecimento"],
        )
        if chave in vistos:
            continue
        vistos.add(chave)
        saida.append(r)
    return saida


# ============================================================
# INSERÇÃO
# ============================================================
def inserir_no_banco(registros: list):
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERRO: DATABASE_URL não está definida.")
        return

    conn = psycopg2.connect(url)
    try:
        cur = conn.cursor()

        query = """
            INSERT INTO bncc_estrutura
                (id, etapa, ano, componente, unidade_tematica, objeto_conhecimento,
                 habilidade_codigo, habilidade_texto, descritores_relacionados,
                 tem_descritor, referencial, complemento_pi)
            VALUES %s
            ON CONFLICT (referencial, habilidade_codigo, unidade_tematica, objeto_conhecimento)
            DO UPDATE SET
                habilidade_texto = EXCLUDED.habilidade_texto,
                tem_descritor = EXCLUDED.tem_descritor
        """

        valores = [
            (
                r["id"], r["etapa"], r["ano"], r["componente"],
                r["unidade_tematica"], r["objeto_conhecimento"],
                r["habilidade_codigo"], r["habilidade_texto"],
                r["descritores_relacionados"], r["tem_descritor"],
                r["referencial"], r["complemento_pi"],
            )
            for r in registros
        ]

        # Insere em lotes
        lote = 200
        total = 0
        for i in range(0, len(valores), lote):
            execute_values(cur, query, valores[i:i+lote])
            total += len(valores[i:i+lote])
            print(f"  Inseridos: {total}/{len(valores)}")

        conn.commit()

        # Estatísticas
        cur.execute("SELECT COUNT(*) FROM bncc_estrutura")
        total_banco = cur.fetchone()[0]

        cur.execute("""
            SELECT componente, COUNT(*)
            FROM bncc_estrutura
            GROUP BY componente
            ORDER BY componente
        """)
        por_comp = cur.fetchall()

        cur.execute("""
            SELECT COUNT(*) FROM bncc_estrutura WHERE tem_descritor = 'S'
        """)
        com_descritor = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM bncc_estrutura WHERE tem_descritor = 'N'
        """)
        sem_descritor = cur.fetchone()[0]

        cur.close()

        print(f"\n✅ Total inserido nesta execução: {total}")
        print(f"✅ Total na tabela bncc_estrutura: {total_banco}")
        print(f"   Com descritor: {com_descritor}")
        print(f"   Sem descritor: {sem_descritor}")
        print("\nDistribuição por componente:")
        for comp, qtd in por_comp:
            print(f"  {comp:5} → {qtd}")

    finally:
        conn.close()


# ============================================================
# MAIN
# ============================================================
def main():
    inicio = time.time()

    print("=" * 60)
    print("  IMPORTAÇÃO DA ESTRUTURA CURRICULAR BNCC")
    print("=" * 60)

    registros_ef = importar_ef()
    print(f"\n📊 Total EF (bruto): {len(registros_ef)} habilidades")

    registros_ei = importar_ei()
    print(f"📊 Total EI (bruto): {len(registros_ei)} objetivos")

    todos = registros_ef + registros_ei
    print(f"\n📊 TOTAL BRUTO: {len(todos)} registros")

    # Deduplica
    todos = deduplicar(todos)
    print(f"📊 Após deduplicação: {len(todos)} registros únicos")

    if not todos:
        print("\n⚠️ Nenhum registro para importar.")
        return

    print("\n💾 Inserindo no banco...")
    inserir_no_banco(todos)

    duracao = time.time() - inicio
    print(f"\n⏱️ Tempo total: {duracao:.1f}s")
    print("=" * 60)
    print("✅ Importação concluída!")
    print("=" * 60)


if __name__ == "__main__":
    main()