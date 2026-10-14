"""
Script de importação do Currículo do Piauí para a tabela `curriculo_piaui_skills`.

Lê o arquivo `curriculo_piaui_final.json` e insere os registros no banco.

Rodar UMA VEZ. Idempotente: se rodar de novo, atualiza em vez de duplicar.
"""
import os
import json
import uuid
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values


DIR = Path(__file__).parent
ARQUIVO_JSON = DIR / "curriculo_piaui_final.json"


def main():
    # 1. Validação
    if not ARQUIVO_JSON.exists():
        print(f"ERRO: arquivo não encontrado: {ARQUIVO_JSON}")
        return

    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERRO: DATABASE_URL não está definida nesta sessão do CMD.")
        return

    # 2. Lê o JSON
    print(f"Lendo: {ARQUIVO_JSON}")
    with ARQUIVO_JSON.open("r", encoding="utf-8") as f:
        habilidades = json.load(f)
    print(f"  → {len(habilidades)} habilidades carregadas")
    print("")

    # 3. Conecta ao banco
    conn = psycopg2.connect(url)
    cur = conn.cursor()

    # 4. Importa (UPSERT: insere ou atualiza)
    registros = []
    for h in habilidades:
        registros.append((
            str(uuid.uuid4()),                    # id
            h["codigo"],                          # codigo
            h["codigo_bncc"],                     # codigo_bncc
            h.get("ordem"),                       # ordem
            h["texto"],                           # texto
            h.get("etapa"),                       # etapa
            h.get("ano"),                         # ano
            h.get("componente"),                  # componente
            h.get("unidade_tematica") or "",      # unidade_tematica
            h.get("objeto_conhecimento") or "",   # objeto_conhecimento
        ))

    # UPSERT por `codigo` (única chave)
    query = """
        INSERT INTO curriculo_piaui_skills
            (id, codigo, codigo_bncc, ordem, texto, etapa, ano, componente, unidade_tematica, objeto_conhecimento)
        VALUES %s
        ON CONFLICT (codigo) DO UPDATE SET
            codigo_bncc = EXCLUDED.codigo_bncc,
            ordem = EXCLUDED.ordem,
            texto = EXCLUDED.texto,
            etapa = EXCLUDED.etapa,
            ano = EXCLUDED.ano,
            componente = EXCLUDED.componente,
            unidade_tematica = EXCLUDED.unidade_tematica,
            objeto_conhecimento = EXCLUDED.objeto_conhecimento
    """
    execute_values(cur, query, registros)
    conn.commit()

    # 5. Estatísticas
    cur.execute("SELECT COUNT(*) FROM curriculo_piaui_skills")
    total = cur.fetchone()[0]

    cur.execute("""
        SELECT componente, COUNT(*)
        FROM curriculo_piaui_skills
        GROUP BY componente
        ORDER BY componente
    """)
    por_componente = cur.fetchall()

    cur.close()
    conn.close()

    print(f"OK: {len(registros)} registros importados/atualizados")
    print(f"    Total na tabela: {total}")
    print("")
    print("Distribuição por componente:")
    for comp, qtd in por_componente:
        print(f"  {comp or '?':5} → {qtd}")
    print("")
    print("Importação concluída!")


if __name__ == "__main__":
    main()