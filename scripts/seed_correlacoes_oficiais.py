"""
Seed OFICIAL — insere correlacoes habilidade BNCC <-> descritor SAEB/SAEPI.

Fonte: matrizes oficiais (INEP + CAEd/UFJF).
NAO remove nada. Apenas adiciona (ON CONFLICT DO NOTHING).
Idempotente: pode rodar varias vezes sem duplicar.

Rodar (com venv ativado):
    cd /d C:\\Projetos\\SIMIDNAPE2
    python scripts\\seed_correlacoes_oficiais.py
"""
import sys
from pathlib import Path
from uuid import uuid4

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from sqlalchemy import text
from app.core.database import engine


# ============================================================
# MAPEAMENTO OFICIAL
# Chave: (componente, fonte, ano, codigo_descritor)
# Valor: lista de codigos BNCC correlacionados
# ============================================================
MAPEAMENTO = {
    # ---------- SAEB LP 2o (H1-H10) ----------
    ("LP", "saeb", 2, "H1"):  ["EF02LP02", "EF02LP04"],
    ("LP", "saeb", 2, "H2"):  ["EF12LP01"],
    ("LP", "saeb", 2, "H3"):  ["EF02LP01"],
    ("LP", "saeb", 2, "H4"):  ["EF12LP01"],
    ("LP", "saeb", 2, "H5"):  ["EF15LP03"],
    ("LP", "saeb", 2, "H6"):  ["EF15LP01"],
    ("LP", "saeb", 2, "H7"):  ["EF35LP03"],
    ("LP", "saeb", 2, "H8"):  ["EF35LP04"],
    ("LP", "saeb", 2, "H9"):  ["EF15LP14"],
    ("LP", "saeb", 2, "H10"): ["EF02LP26"],

    # ---------- SAEB LP 5o (D01-D15) ----------
    ("LP", "saeb", 5, "D01"): ["EF15LP03"],
    ("LP", "saeb", 5, "D02"): ["EF35LP02", "EF35LP14"],
    ("LP", "saeb", 5, "D03"): ["EF35LP05"],
    ("LP", "saeb", 5, "D04"): ["EF35LP04"],
    ("LP", "saeb", 5, "D05"): ["EF15LP14", "EF35LP23"],
    ("LP", "saeb", 5, "D06"): ["EF35LP03"],
    ("LP", "saeb", 5, "D07"): ["EF04LP10", "EF05LP09"],
    ("LP", "saeb", 5, "D08"): ["EF05LP11"],
    ("LP", "saeb", 5, "D09"): ["EF15LP01", "EF35LP16"],
    ("LP", "saeb", 5, "D11"): ["EF04LP15", "EF05LP15"],
    ("LP", "saeb", 5, "D13"): ["EF04LP05", "EF05LP04"],
    ("LP", "saeb", 5, "D14"): ["EF04LP05", "EF05LP04"],
    ("LP", "saeb", 5, "D15"): ["EF15LP15", "EF35LP06"],

    # ---------- SAEB LP 9o (D01-D15) ----------
    ("LP", "saeb", 9, "D01"): ["EF67LP14", "EF69LP03"],
    ("LP", "saeb", 9, "D02"): ["EF09LP11", "EF69LP56"],
    ("LP", "saeb", 9, "D03"): ["EF67LP38", "EF89LP37"],
    ("LP", "saeb", 9, "D04"): ["EF69LP44", "EF89LP34"],
    ("LP", "saeb", 9, "D05"): ["EF69LP05", "EF69LP17"],
    ("LP", "saeb", 9, "D06"): ["EF67LP10", "EF89LP32"],
    ("LP", "saeb", 9, "D07"): ["EF09LP03", "EF89LP14"],
    ("LP", "saeb", 9, "D08"): ["EF09LP04", "EF89LP14"],
    ("LP", "saeb", 9, "D09"): ["EF67LP20", "EF89LP32"],
    ("LP", "saeb", 9, "D10"): ["EF69LP47", "EF89LP35"],
    ("LP", "saeb", 9, "D11"): ["EF09LP11", "EF67LP30"],
    ("LP", "saeb", 9, "D12"): ["EF69LP21", "EF69LP42"],
    ("LP", "saeb", 9, "D13"): ["EF69LP55", "EF89LP29"],
    ("LP", "saeb", 9, "D14"): ["EF67LP04", "EF89LP13"],
    ("LP", "saeb", 9, "D15"): ["EF09LP11", "EF67LP30"],

    # ---------- SAEB MA 5o (D01-D28) ----------
    ("MA", "saeb", 5, "D01"): ["EF04MA16", "EF05MA14"],
    ("MA", "saeb", 5, "D02"): ["EF05MA16"],
    ("MA", "saeb", 5, "D03"): ["EF03MA15", "EF05MA18"],
    ("MA", "saeb", 5, "D04"): ["EF03MA15", "EF04MA18"],
    ("MA", "saeb", 5, "D05"): ["EF04MA19", "EF06MA21"],
    ("MA", "saeb", 5, "D06"): ["EF03MA21", "EF04MA20"],
    ("MA", "saeb", 5, "D07"): ["EF04MA21", "EF05MA19"],
    ("MA", "saeb", 5, "D08"): ["EF03MA22", "EF04MA22"],
    ("MA", "saeb", 5, "D09"): ["EF03MA23", "EF04MA22"],
    ("MA", "saeb", 5, "D10"): ["EF03MA24", "EF04MA25"],
    ("MA", "saeb", 5, "D11"): ["EF05MA20"],
    ("MA", "saeb", 5, "D12"): ["EF05MA20", "EF05MA21"],
    ("MA", "saeb", 5, "D13"): ["EF02MA01", "EF04MA02"],
    ("MA", "saeb", 5, "D14"): ["EF03MA02", "EF04MA01"],
    ("MA", "saeb", 5, "D15"): ["EF03MA01", "EF04MA02"],
    ("MA", "saeb", 5, "D16"): ["EF04MA09", "EF05MA05"],
    ("MA", "saeb", 5, "D17"): ["EF03MA03", "EF04MA03"],
    ("MA", "saeb", 5, "D18"): ["EF03MA04", "EF04MA04"],
    ("MA", "saeb", 5, "D19"): ["EF03MA06", "EF04MA05"],
    ("MA", "saeb", 5, "D20"): ["EF03MA07", "EF04MA06"],
    ("MA", "saeb", 5, "D21"): ["EF05MA03", "EF06MA07"],
    ("MA", "saeb", 5, "D22"): ["EF05MA02"],
    ("MA", "saeb", 5, "D23"): ["EF05MA07"],
    ("MA", "saeb", 5, "D24"): ["EF05MA07"],
    ("MA", "saeb", 5, "D25"): ["EF05MA08"],
    ("MA", "saeb", 5, "D26"): ["EF05MA06"],
    ("MA", "saeb", 5, "D27"): ["EF04MA27", "EF05MA24"],
    ("MA", "saeb", 5, "D28"): ["EF04MA28", "EF05MA25"],

    # ---------- SAEB MA 9o — apenas D29-D37 (matriz tradicional alinhada) ----------
    ("MA", "saeb", 9, "D29"): ["EF09MA08"],
    ("MA", "saeb", 9, "D30"): ["EF07MA14", "EF08MA06"],
    ("MA", "saeb", 9, "D31"): ["EF09MA09"],
    ("MA", "saeb", 9, "D32"): ["EF07MA15", "EF08MA11"],
    ("MA", "saeb", 9, "D33"): ["EF07MA18", "EF08MA13"],
    ("MA", "saeb", 9, "D34"): ["EF08MA08"],
    ("MA", "saeb", 9, "D35"): ["EF08MA07"],
    ("MA", "saeb", 9, "D36"): ["EF09MA21"],
    ("MA", "saeb", 9, "D37"): ["EF07MA36", "EF08MA23"],

    # ---------- SAEPI LP 2o (D01-D10) ----------
    ("LP", "saepi", 2, "D01"): ["EF02LP02", "EF02LP04"],
    ("LP", "saepi", 2, "D02"): ["EF12LP01"],
    ("LP", "saepi", 2, "D03"): ["EF12LP01"],
    ("LP", "saepi", 2, "D04"): ["EF15LP03"],
    ("LP", "saepi", 2, "D05"): ["EF15LP01"],
    ("LP", "saepi", 2, "D06"): ["EF35LP03"],
    ("LP", "saepi", 2, "D07"): ["EF35LP04"],
    ("LP", "saepi", 2, "D08"): ["EF15LP14"],
    ("LP", "saepi", 2, "D09"): ["EF02LP01"],
    ("LP", "saepi", 2, "D10"): ["EF02LP26"],
}

# ---------- SAEPI LP 3o-9o (mesmo padrao por ano) ----------
SAEPI_LP_3_9 = {
    "D01": ["EF15LP03"],
    "D02": ["EF35LP02", "EF35LP14"],
    "D03": ["EF35LP05"],
    "D04": ["EF35LP04"],
    "D05": ["EF15LP14", "EF35LP23"],
    "D06": ["EF35LP03"],
    "D07": ["EF04LP10", "EF05LP09"],
    "D08": ["EF05LP11"],
    "D10": ["EF69LP47", "EF89LP35"],
    "D12": ["EF15LP01"],
    "D14": ["EF04LP15", "EF05LP15"],
    "D16": ["EF35LP04", "EF05LP10"],
    "D17": ["EF04LP05", "EF05LP04"],
    "D20": ["EF15LP15", "EF35LP06"],
}
for _ano in [3, 4, 5, 6, 7, 8, 9]:
    for _cod, _skills in SAEPI_LP_3_9.items():
        MAPEAMENTO[("LP", "saepi", _ano, _cod)] = _skills

# ---------- SAEPI MA 2o-9o (mesmo padrao por ano) ----------
SAEPI_MA = {
    "D01": ["EF04MA16", "EF05MA14"],
    "D02": ["EF05MA16"],
    "D03": ["EF03MA15", "EF05MA18"],
    "D04": ["EF03MA15", "EF04MA18"],
    "D05": ["EF04MA19", "EF06MA21"],
    "D06": ["EF03MA21", "EF04MA20"],
    "D07": ["EF04MA21", "EF05MA19"],
    "D08": ["EF03MA22", "EF04MA22"],
    "D09": ["EF03MA23", "EF04MA22"],
    "D10": ["EF03MA24", "EF04MA25"],
    "D11": ["EF05MA20"],
    "D12": ["EF05MA20", "EF05MA21"],
    "D13": ["EF02MA01", "EF04MA02"],
    "D14": ["EF03MA02", "EF04MA01"],
    "D15": ["EF03MA01", "EF04MA02"],
    "D22": ["EF05MA07"],
    "D26": ["EF05MA06"],
    "D27": ["EF04MA27", "EF05MA24"],
    "D28": ["EF04MA28", "EF05MA25"],
    "D29": ["EF06MA13", "EF09MA08"],
}
for _ano in [2, 3, 4, 5, 6, 7, 8, 9]:
    for _cod, _skills in SAEPI_MA.items():
        MAPEAMENTO[("MA", "saepi", _ano, _cod)] = _skills


# ============================================================
# HELPERS
# ============================================================
def buscar_descritor_id(conn, componente, fonte, ano, codigo):
    result = conn.execute(text("""
        SELECT id FROM descritores
        WHERE componente = :c AND fonte = :f AND ano = :a AND codigo = :cod
        LIMIT 1
    """), {"c": componente, "f": fonte, "a": ano, "cod": codigo})
    row = result.fetchone()
    return row[0] if row else None


def skill_existe(conn, codigo):
    result = conn.execute(text("""
        SELECT 1 FROM bncc_estrutura WHERE habilidade_codigo = :c LIMIT 1
    """), {"c": codigo})
    return result.fetchone() is not None


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 70)
    print("  SEED OFICIAL — CORRELACOES BNCC <-> SAEB/SAEPI")
    print("=" * 70)

    total_pares = sum(len(v) for v in MAPEAMENTO.values())
    print(f"\nTotal de pares (descritor, skill) a processar: {total_pares}")
    print(f"Total de descritores mapeados: {len(MAPEAMENTO)}")

    inseridos = 0
    ja_existiam = 0
    sem_descritor = []
    sem_skill = []

    with engine.begin() as conn:
        for (comp, fonte, ano, codigo), skills in sorted(MAPEAMENTO.items()):
            desc_id = buscar_descritor_id(conn, comp, fonte, ano, codigo)
            if not desc_id:
                sem_descritor.append((comp, fonte, ano, codigo))
                continue

            for skill in skills:
                if not skill_existe(conn, skill):
                    sem_skill.append((skill, comp, fonte, ano, codigo))
                    continue

                result = conn.execute(text("""
                    INSERT INTO habilidade_descritor
                        (id, habilidade_codigo, descritor_id, confianca, fonte_correlacao, revisado)
                    VALUES (:id, :hab, :desc, 'alta', 'manual', TRUE)
                    ON CONFLICT (habilidade_codigo, descritor_id) DO NOTHING
                    RETURNING id
                """), {
                    "id": str(uuid4()),
                    "hab": skill,
                    "desc": str(desc_id),
                })
                row = result.fetchone()
                if row:
                    inseridos += 1
                else:
                    ja_existiam += 1

    # ---------- Relatorio ----------
    print("\n" + "=" * 70)
    print("  RESULTADO")
    print("=" * 70)
    print(f"\n[OK] Inseridos:              {inseridos}")
    print(f"[=]  Ja existiam (ignorados): {ja_existiam}")
    print(f"[!]  Descritores nao encontrados no banco: {len(sem_descritor)}")
    print(f"[!]  Skills BNCC nao encontradas:           {len(sem_skill)}")

    if sem_descritor:
        print("\n--- Descritores nao encontrados (verificar se estao no banco): ---")
        for item in sem_descritor[:30]:
            print(f"    {item}")
        if len(sem_descritor) > 30:
            print(f"    ... (+{len(sem_descritor) - 30})")

    if sem_skill:
        print("\n--- Skills BNCC nao encontradas: ---")
        for item in sem_skill[:30]:
            print(f"    {item}")
        if len(sem_skill) > 30:
            print(f"    ... (+{len(sem_skill) - 30})")

    # Total final
    with engine.connect() as conn:
        total_final = conn.execute(text("SELECT COUNT(*) FROM habilidade_descritor")).fetchone()[0]
    print(f"\n[FINAL] Total de correlacoes em habilidade_descritor: {total_final}")
    print("\n" + "=" * 70)
    print("  FIM DO SEED")
    print("=" * 70)


if __name__ == "__main__":
    main()