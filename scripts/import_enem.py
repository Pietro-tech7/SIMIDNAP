"""
Script para popular o banco de questões do SIMIDNAPE com o ENEM.

USO:
    cd /d C:\\Projetos\\SIMIDNAPE2
    python scripts/import_enem.py

    Ou com intervalo personalizado:
    python scripts/import_enem.py --inicio 2015 --fim 2023

O script é IDEMPOTENTE: rodar duas vezes não duplica questões.
"""

import sys
import os
import argparse

# ============================================================
# GARANTE QUE A RAIZ DO PROJETO ESTÁ NO PATH
# ============================================================
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ============================================================
# IMPORTS DO PROJETO
# ============================================================
from app.core.database import SessionLocal
from app.services.question_import_service import importar_enem


# ============================================================
# MAIN
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description="Importa questões do ENEM para o banco do SIMIDNAPE."
    )
    parser.add_argument(
        "--inicio", type=int, default=2009,
        help="Ano de início da importação (default: 2009)"
    )
    parser.add_argument(
        "--fim", type=int, default=2023,
        help="Ano final da importação (default: 2023)"
    )
    args = parser.parse_args()

    if args.inicio > args.fim:
        print(f"[ERRO] --inicio ({args.inicio}) é maior que --fim ({args.fim})")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  IMPORTADOR DE QUESTÕES DO ENEM")
    print(f"  Intervalo: {args.inicio} a {args.fim}")
    print("=" * 60 + "\n")

    db = SessionLocal()
    try:
        stats = importar_enem(
            db=db,
            ano_inicio=args.inicio,
            ano_fim=args.fim,
            verbose=True,
        )

        print("\n" + "=" * 60)
        print("  RESUMO FINAL")
        print("=" * 60)
        print(f"  ✓ Questões importadas: {stats['importadas']}")
        print(f"  ○ Já existiam:         {stats['ignoradas']}")
        print(f"  ✗ Erros:                {stats['erros']}")
        print(f"  📚 Provas processadas:  {stats['total_provas']}")
        print("=" * 60 + "\n")

        if stats["erros"] > 0:
            print("⚠  Alguns erros ocorreram. Verifique os logs acima.\n")

        if stats["importadas"] == 0 and stats["ignoradas"] == 0:
            print("⚠  Nenhuma questão foi importada nem ignorada.")
            print("   Verifique se a API enem.dev está acessível.\n")

    except KeyboardInterrupt:
        print("\n\n[Interrompido pelo usuário]\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERRO FATAL] {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()