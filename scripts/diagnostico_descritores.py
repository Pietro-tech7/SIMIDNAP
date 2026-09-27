"""
Script de DIAGNOSTICO — somente leitura.

Usa o engine do proprio projeto (app.core.database) — nao precisa instalar nada.
NAO ALTERA NADA. So imprime no terminal.

Rodar (com venv ativado):
    cd /d C:\\Projetos\\SIMIDNAPE2
    python scripts\\diagnostico_descritores.py
"""
import os
import sys
from pathlib import Path

# Garante que a raiz do projeto esteja no sys.path para importar 'app'
RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from sqlalchemy import text
from app.core.database import engine


def run_sql(sql, params=None):
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        return result.fetchall()


def main():
    print("=" * 70)
    print("  DIAGNOSTICO — SIMIDNAPE PRO")
    print("=" * 70)

    try:
        # Teste de conexao
        run_sql("SELECT 1")
        print("\n[OK] Conexao com o banco estabelecida.")
    except Exception as e:
        print(f"\n[ERRO] Nao foi possivel conectar no banco: {e}")
        sys.exit(1)

    # 1) Total de descritores
    try:
        total_desc = run_sql("SELECT COUNT(*) FROM descritores")[0][0]
        ativos = run_sql("SELECT COUNT(*) FROM descritores WHERE ativo = TRUE")[0][0]
        print(f"\n[1] Total de descritores: {total_desc} (ativos: {ativos})")
    except Exception as e:
        print(f"\n[1] ERRO ao contar descritores: {e}")
        return

    # 2) Agrupamento por (componente, fonte, ano)
    print("\n[2] Descritores agrupados por (componente, fonte, ano):")
    try:
        grupos = run_sql("""
            SELECT componente, fonte, ano, COUNT(*) as qtd
            FROM descritores
            WHERE ativo = TRUE
            GROUP BY componente, fonte, ano
            ORDER BY componente, fonte, ano
        """)
        if not grupos:
            print("    (nenhum descritor ativo encontrado)")
        for comp, fonte, ano, qtd in grupos:
            print(f"    {comp:3s} | {fonte:8s} | ano={str(ano):5s} -> {qtd} descritores")
    except Exception as e:
        print(f"    ERRO: {e}")
        grupos = []

    # 3) Codigos por grupo
    print("\n[3] Codigos exatos por grupo:")
    for comp, fonte, ano, qtd in grupos:
        try:
            if ano is None:
                rows = run_sql("""
                    SELECT codigo FROM descritores
                    WHERE ativo = TRUE AND componente = :c AND fonte = :f AND ano IS NULL
                    ORDER BY codigo
                """, {"c": comp, "f": fonte})
            else:
                rows = run_sql("""
                    SELECT codigo FROM descritores
                    WHERE ativo = TRUE AND componente = :c AND fonte = :f AND ano = :a
                    ORDER BY codigo
                """, {"c": comp, "f": fonte, "a": ano})
            codigos = [r[0] for r in rows]
            print(f"\n    [{comp} / {fonte} / ano={ano}] ({len(codigos)} codigos)")
            if len(codigos) <= 35:
                print(f"      Todos: {', '.join(codigos)}")
            else:
                print(f"      Primeiros 30: {', '.join(codigos[:30])}")
                print(f"      Ultimos 5:    {', '.join(codigos[-5:])}")
        except Exception as e:
            print(f"    ERRO no grupo {comp}/{fonte}/{ano}: {e}")

    # 4) habilidade_descritor
    try:
        total_corr = run_sql("SELECT COUNT(*) FROM habilidade_descritor")[0][0]
        print(f"\n[4] Total de correlacoes em habilidade_descritor: {total_corr}")

        print("\n[4.1] Correlacoes por (fonte_correlacao, revisado):")
        for fonte, rev, qtd in run_sql("""
            SELECT fonte_correlacao, revisado, COUNT(*)
            FROM habilidade_descritor
            GROUP BY fonte_correlacao, revisado
            ORDER BY fonte_correlacao, revisado
        """):
            print(f"    {fonte:12s} | revisado={str(rev):5s} -> {qtd}")

        print("\n[4.2] Correlacoes por confianca:")
        for conf, qtd in run_sql("""
            SELECT confianca, COUNT(*)
            FROM habilidade_descritor
            GROUP BY confianca
            ORDER BY confianca
        """):
            print(f"    {conf:8s} -> {qtd}")
    except Exception as e:
        print(f"\n[4] ERRO: {e}")

    # 5) Verificar skills BNCC
    print("\n[5] Verificacao de skills BNCC (usadas no mapeamento oficial):")
    skills_a_verificar = [
        "EF02MA01", "EF02MA04", "EF03MA01", "EF03MA02", "EF04MA02",
        "EF09MA12", "EF09MA13",
        "EF15LP03", "EF15LP14", "EF15LP15", "EF35LP03", "EF35LP04", "EF35LP05",
    ]
    faltando = []
    for codigo in skills_a_verificar:
        try:
            existe = run_sql(
                "SELECT 1 FROM bncc_estrutura WHERE habilidade_codigo = :c LIMIT 1",
                {"c": codigo},
            )
            status = "OK" if existe else "FALTANDO"
        except Exception as e:
            status = f"ERRO: {e}"
        print(f"    {codigo:12s} -> {status}")
        if status == "FALTANDO":
            faltando.append(codigo)
    if faltando:
        print(f"\n    ATENCAO: {len(faltando)} skills nao encontradas: {faltando}")

    print("\n" + "=" * 70)
    print("  FIM DO DIAGNOSTICO")
    print("=" * 70)


if __name__ == "__main__":
    main()