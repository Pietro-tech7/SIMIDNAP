"""
Script de retenção de questões do Motor 9 — FASE 4.

Aplica a política de 3 camadas:

  Nível 1 (rascunho, nunca usado em prova)
    → apaga depois de 30 dias desde created_at
  Nível 2 (usado em prova — PDF/Word gerado)
    → apaga depois de 90 dias desde ultima_utilizacao_em
  Nível 3 (favorito / reutilizado)
    → nunca apaga

Filtros de segurança:
  - Só mexe em questões com origem = 'gerada_ia'
    (nunca toca em questões curadas do Motor 8, importadas ou de colaborador)
  - Ignora questões com trashed_at preenchido
    (a lixeira tem sua própria política de 30 dias, gerenciada pelo admin)

Uso:
  python -m app.jobs.run_retention
  python -m app.jobs.run_retention --dry-run    (só mostra, não apaga)
"""

import sys
from datetime import datetime, timedelta

from ..core.database import SessionLocal
from ..models.question_bank_fundamental import QuestionBankFundamental


DIAS_NIVEL_1 = 30   # rascunho nunca usado
DIAS_NIVEL_2 = 90   # usado em prova


def aplicar_retencao(dry_run: bool = False) -> dict:
    """
    Aplica a política de retenção. Retorna estatísticas.
    Se dry_run=True, apenas conta — não apaga nada.
    """
    db = SessionLocal()
    agora = datetime.utcnow()
    limite_n1 = agora - timedelta(days=DIAS_NIVEL_1)
    limite_n2 = agora - timedelta(days=DIAS_NIVEL_2)

    stats = {
        "agora": agora.isoformat(),
        "limite_nivel_1": limite_n1.isoformat(),
        "limite_nivel_2": limite_n2.isoformat(),
        "nivel_1_encontradas": 0,
        "nivel_2_encontradas": 0,
        "total_apagadas": 0,
        "dry_run": dry_run,
    }

    try:
        # Nível 1 — rascunho nunca usado
        ids_n1 = [
            q.id
            for q in db.query(QuestionBankFundamental.id)
            .filter(
                QuestionBankFundamental.retencao_nivel == 1,
                QuestionBankFundamental.origem == "gerada_ia",
                QuestionBankFundamental.trashed_at.is_(None),
                QuestionBankFundamental.created_at < limite_n1,
            )
            .all()
        ]
        stats["nivel_1_encontradas"] = len(ids_n1)

        # Nível 2 — usado em prova, mas antigo
        ids_n2 = [
            q.id
            for q in db.query(QuestionBankFundamental.id)
            .filter(
                QuestionBankFundamental.retencao_nivel == 2,
                QuestionBankFundamental.origem == "gerada_ia",
                QuestionBankFundamental.trashed_at.is_(None),
                QuestionBankFundamental.ultima_utilizacao_em.isnot(None),
                QuestionBankFundamental.ultima_utilizacao_em < limite_n2,
            )
            .all()
        ]
        stats["nivel_2_encontradas"] = len(ids_n2)

        if not dry_run:
            if ids_n1:
                db.query(QuestionBankFundamental).filter(
                    QuestionBankFundamental.id.in_(ids_n1)
                ).delete(synchronize_session=False)
            if ids_n2:
                db.query(QuestionBankFundamental).filter(
                    QuestionBankFundamental.id.in_(ids_n2)
                ).delete(synchronize_session=False)
            db.commit()

        stats["total_apagadas"] = len(ids_n1) + len(ids_n2)
        return stats

    except Exception as e:
        db.rollback()
        stats["erro"] = str(e)
        return stats
    finally:
        db.close()


def main():
    dry_run = "--dry-run" in sys.argv
    print(f"[Retenção] Iniciando — modo: {'DRY-RUN (nada será apagado)' if dry_run else 'REAL'}")
    stats = aplicar_retencao(dry_run=dry_run)
    for k, v in stats.items():
        print(f"  {k}: {v}")
    if "erro" in stats:
        print("[Retenção] ERRO — verifique o log acima.")
        sys.exit(1)
    print("[Retenção] Concluído.")


if __name__ == "__main__":
    main()