"""
Importa toda a estrutura curricular da BNCC para a tabela `bncc_estrutura`.

Fontes:
- Educação Infantil: objetivos de aprendizagem (via `objetivos_ei`)
- Ensino Fundamental: habilidades (via `habilidades_ef`)
- Ensino Médio: (não importado nesta fase)

Cada linha representa:
  Componente → Unidade Temática → Objeto de Conhecimento → Habilidade

Descritores: marcados heuristicamente (MA, LP, e CI/HI/GE do 9º ano).
Os descritores reais serão adicionados em bloco posterior.

Rodar UMA VEZ. Idempotente (usa ON CONFLICT DO UPDATE).
"""
import os
import time
import psycopg2
from psycopg2.extras import execute_values
import uuid
import bncc


# ============================================================
# MAPA DE COMPONENTES (nome → código)
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

# Componentes do EF que vamos importar
COMPONENTES_EF = ["MA", "LP", "CI", "GE", "HI", "AR", "EF", "ER", "LI"]

# Campos de experiência da EI
CAMPOS_EI = ["EO", "CG", "TS", "EF", "ET"]


# ============================================================
# HEURÍSTICA DE DESCRITORES
# ============================================================
def tem_descritor(componente: str, ano: int | None) -> str:
    """
    Retorna 'S' ou 'N' conforme o componente/ano tenham descritores.
    - MA, LP: sempre têm
    - CI, HI, GE: só no 9º ano
    - Outros: não têm
    """
    if componente in ("MA", "LP"):
        return "S"
    if componente in ("CI", "HI", "GE") and ano == 9:
        return "S"
    return "N"


# ============================================================
# NORMALIZAÇÃO DE UMA HABILIDADE
# ============================================================
def normalizar_habilidade(item: dict) -> dict | None:
    """Extrai campos relevantes de uma habilidade retornada pela biblioteca."""
    codigo = item.get("codigo")
    texto = item.get("texto")
    etapa = item.get("etapa")
    if not codigo or not texto or not etapa:
        return None

    # Ano (primeiro da lista)
    anos = item.get("anos") or []
    ano = anos[0] if anos else None

    # Componente
    componente_nome = (item.get("componente") or {}).get("nome", "")
    componente = MAPA_COMPONENTES.get(componente_nome)
    if not componente:
        return None

    # Organização (Unidade Temática OU Campo de Prática)
    org = item.get("organizacao") or {}
    tipo_org = org.get("tipo")
    nomes = org.get("nomes") or {}

    unidade = None
    prefixo_objeto = ""

    if tipo_org == "unidade_tematica":
        unidade = nomes.get("unidade_tematica")
    elif tipo_org == "campo_pratica":
        # Em LP, o "campo de atuação" faz o papel de unidade temática
        campos = nomes.get("campos_atuacao") or []
        unidade = " / ".join(campos) if campos else None
        # Guarda a prática de linguagem junto do objeto
        pratica = nomes.get("pratica_linguagem")
        if pratica:
            prefixo_objeto = f"[{pratica}] "
    else:
        # Formato desconhecido — tenta pegar qualquer chave de nomes
        for k, v in nomes.items():
            if isinstance(v, str):
                unidade = v
                break

    # Objeto de conhecimento
    objetos = item.get("objetos_conhecimento") or []
    objetos_nomes = [o.get("nome") for o in objetos if o.get("nome")]
    objeto = " | ".join(objetos_nomes) if objetos_nomes else None

    # Adiciona prefixo da prática de linguagem (se houver)
    if prefixo_objeto and objeto:
        objeto = f"{prefixo_objeto}{objeto}"
    elif prefixo_objeto:
        objeto = prefixo_objeto.strip()

    # Trunca strings para caber no banco (VARCHAR(200) e VARCHAR(300))
    if unidade and len(unidade) > 200:
        unidade = unidade[:197] + "..."
    if objeto and len(objeto) > 300:
        objeto = objeto[:297] + "..."

    return {
        "id": str(uuid.uuid4()),
        "etapa": etapa,
        "ano": ano,
        "componente": componente,
        "unidade_tematica": unidade,
        "objeto_conhecimento": objeto,
        "habilidade_codigo": codigo,
        "habilidade_texto": texto,
        "descritores_relacionados": None,
        "tem_descritor": tem_descritor(componente, ano),
        "referencial": "bncc",
        "complemento_pi": None,
    }


# ============================================================
# IMPORTAÇÃO
# ============================================================
def importar_ef() -> list:
    """Importa todas as habilidades do Ensino Fundamental."""
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
    """Importa os objetivos de aprendizagem da Educação Infantil."""
    todos = []
    print("\n[EI] Processando Educação Infantil")
    for campo in CAMPOS_EI:
        try:
            lista = bncc.objetivos_ei(campo=campo) or []
        except Exception as e:
            print(f"  Campo {campo}: erro -> {e}")
            continue

        for item in lista:
            norm = normalizar_habilidade(item)
            if norm:
                # Em EI, o campo de experiência vai como unidade temática
                norm["etapa"] = "EI"
                norm["ano"] = None
                todos.append(norm)

        print(f"  Campo {campo}: {len(lista)} objetivo(s)")

    return todos


# ============================================================
# INSERÇÃO NO BANCO
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

        # Insere em lotes de 200
        lote = 200
        total = 0
        for i in range(0, len(valores), lote):
            execute_values(cur, query, valores[i:i+lote])
            total += len(valores[i:i+lote])
            print(f"  Inseridos: {total}/{len(valores)}")

        conn.commit()

        # Contagem final
        cur.execute("SELECT COUNT(*) FROM bncc_estrutura")
        total_banco = cur.fetchone()[0]

        cur.execute("""
            SELECT componente, COUNT(*)
            FROM bncc_estrutura
            GROUP BY componente
            ORDER BY componente
        """)
        por_comp = cur.fetchall()

        cur.close()

        print(f"\n✅ Total inserido nesta execução: {total}")
        print(f"✅ Total na tabela bncc_estrutura: {total_banco}")
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

    # Importa EF
    registros_ef = importar_ef()
    print(f"\n📊 Total EF: {len(registros_ef)} habilidades")

    # Importa EI
    registros_ei = importar_ei()
    print(f"📊 Total EI: {len(registros_ei)} objetivos")

    # Consolida
    todos = registros_ef + registros_ei
    print(f"\n📊 TOTAL GERAL: {len(todos)} registros")

    if not todos:
        print("\n⚠️ Nenhum registro para importar.")
        return

    # Insere no banco
    print("\n💾 Inserindo no banco...")
    inserir_no_banco(todos)

    duracao = time.time() - inicio
    print(f"\n⏱️ Tempo total: {duracao:.1f}s")
    print("=" * 60)
    print("✅ Importação concluída!")
    print("=" * 60)


if __name__ == "__main__":
    main()