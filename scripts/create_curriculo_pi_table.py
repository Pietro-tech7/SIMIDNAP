"""
Script temporário: cria a tabela `curriculo_piaui_skills`.
Rodar UMA VEZ. Depois pode apagar.
"""
import os
import psycopg2

SQL = """
CREATE TABLE IF NOT EXISTS curriculo_piaui_skills (
    id UUID PRIMARY KEY,
    codigo VARCHAR(30) UNIQUE NOT NULL,
    codigo_bncc VARCHAR(20) NOT NULL,
    ordem INTEGER,
    texto TEXT NOT NULL,
    etapa VARCHAR(2),
    ano INTEGER,
    componente VARCHAR(10),
    unidade_tematica VARCHAR(200),
    objeto_conhecimento TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_curriculo_pi_codigo_bncc ON curriculo_piaui_skills(codigo_bncc);
CREATE INDEX IF NOT EXISTS ix_curriculo_pi_etapa_ano ON curriculo_piaui_skills(etapa, ano);
CREATE INDEX IF NOT EXISTS ix_curriculo_pi_componente ON curriculo_piaui_skills(componente);
"""


def main():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERRO: DATABASE_URL não está definida nesta sessão do CMD.")
        return

    conn = psycopg2.connect(url)
    try:
        cur = conn.cursor()
        cur.execute(SQL)
        conn.commit()
        cur.close()
        print("OK: Tabela curriculo_piaui_skills criada com sucesso!")
    finally:
        conn.close()


if __name__ == "__main__":
    main()