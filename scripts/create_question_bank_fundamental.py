"""Script temporário: cria a tabela `question_bank_fundamental`."""
import os
import psycopg2


SQL = """
CREATE TABLE IF NOT EXISTS question_bank_fundamental (
    id UUID PRIMARY KEY,
    fonte VARCHAR(50),
    ano INTEGER,
    etapa VARCHAR(2) NOT NULL,
    serie VARCHAR(50),
    componente VARCHAR(10),
    disciplina VARCHAR(100),
    numero INTEGER,
    tipo VARCHAR(30),
    enunciado TEXT NOT NULL,
    alternativas JSONB,
    gabarito VARCHAR(500),
    imagem_url TEXT,
    imagens_extras JSONB,
    habilidades JSONB,
    habilidade_codigo VARCHAR(50),
    referencial VARCHAR(30),
    referencias_extras JSONB,
    descritores JSONB,
    dificuldade VARCHAR(20),
    origem VARCHAR(20) NOT NULL DEFAULT 'manual',
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved BOOLEAN NOT NULL DEFAULT TRUE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    anulada BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_qbf_etapa_ano ON question_bank_fundamental(etapa, ano);
CREATE INDEX IF NOT EXISTS ix_qbf_componente ON question_bank_fundamental(componente);
CREATE INDEX IF NOT EXISTS ix_qbf_referencial ON question_bank_fundamental(referencial);
CREATE INDEX IF NOT EXISTS ix_qbf_approved_origem ON question_bank_fundamental(approved, origem);
CREATE INDEX IF NOT EXISTS ix_qbf_habilidade ON question_bank_fundamental(habilidade_codigo);
"""


def main():
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ERRO: DATABASE_URL não definida.")
        return
    conn = psycopg2.connect(url)
    try:
        cur = conn.cursor()
        cur.execute(SQL)
        conn.commit()
        cur.close()
        print("OK: Tabela question_bank_fundamental criada com sucesso!")
    finally:
        conn.close()


if __name__ == "__main__":
    main()