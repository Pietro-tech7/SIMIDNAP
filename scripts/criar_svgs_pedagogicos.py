"""
Cria os SVGs pedagogicos nas 5 novas categorias:
  ordem/, medida/, decomposicao/, comparacao/, sequencia/
E adiciona 4 SVGs novos em genericos/ (dado, moeda, presente, trofeu).

Idempotente: NAO sobrescreve arquivos existentes.
Rodar UMA VEZ com o venv ativado.
"""
from pathlib import Path
import sys

RAIZ = Path(__file__).resolve().parent.parent
ICONS_DIR = RAIZ / "frontend" / "public" / "icons"


SVGS = {
    # ==========================================================
    # ORDEM (posicao, fila, podio, sequencia)
    # ==========================================================
    "ordem/podio.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="10" width="6" height="11" rx="1"/><rect x="2" y="15" width="6" height="6" rx="1"/><rect x="16" y="6" width="6" height="15" rx="1"/></svg>''',

    "ordem/fila.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="2"/><path d="M2 12c0-1.7 1.3-3 3-3s3 1.3 3 3v7H2z"/><circle cx="13" cy="6" r="2"/><path d="M10 12c0-1.7 1.3-3 3-3s3 1.3 3 3v7h-6z"/><circle cx="21" cy="6" r="2"/><path d="M18 12c0-1.7 1.3-3 3-3v10h-3z"/></svg>''',

    "ordem/estante.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/></svg>''',

    "ordem/escada.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h4v-4h4v-4h4v-4h4V5"/><line x1="3" y1="21" x2="21" y2="21"/></svg>''',

    "ordem/ranking.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="2" y="13" width="6" height="8" rx="1"/><rect x="16" y="4" width="6" height="17" rx="1"/><circle cx="12" cy="6" r="1.5" fill="currentColor"/></svg>''',

    "ordem/seta-posicao.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="16 7 21 12 16 17"/><circle cx="7" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>''',

    # ==========================================================
    # MEDIDA (comprimento, massa, tempo)
    # ==========================================================
    "medida/balanca.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="20"/><line x1="5" y1="20" x2="19" y2="20"/><line x1="4" y1="5" x2="20" y2="5"/><path d="M4 5 L2 11 H6 Z"/><path d="M20 5 L18 11 H22 Z"/></svg>''',

    "medida/relogio.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>''',

    "medida/termometro.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><line x1="11.5" y1="7" x2="11.5" y2="14"/></svg>''',

    "medida/fita-metrica.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="8" rx="1"/><line x1="6" y1="8" x2="6" y2="12"/><line x1="10" y1="8" x2="10" y2="12"/><line x1="14" y1="8" x2="14" y2="12"/><line x1="18" y1="8" x2="18" y2="12"/></svg>''',

    "medida/jarra.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2h8v3l-1 2v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7L8 5V2z"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>''',

    "medida/ampulheta.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12M6 22h12"/><path d="M6 2v4l6 6-6 6v4"/><path d="M18 2v4l-6 6 6 6v4"/></svg>''',

    # ==========================================================
    # DECOMPOSICAO (valor posicional, material dourado)
    # ==========================================================
    "decomposicao/bloco-centena.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="13" y1="3" x2="13" y2="21"/><line x1="18" y1="3" x2="18" y2="21"/></svg>''',

    "decomposicao/bloco-dezena.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="3" width="4" height="18" rx="1"/><line x1="10" y1="6" x2="14" y2="6"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="12" x2="14" y2="12"/><line x1="10" y1="15" x2="14" y2="15"/><line x1="10" y1="18" x2="14" y2="18"/></svg>''',

    "decomposicao/bloco-unidade.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></svg>''',

    "decomposicao/material-dourado.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="8" height="8" rx="0.5"/><line x1="2" y1="18" x2="10" y2="18"/><line x1="6" y1="14" x2="6" y2="22"/><rect x="13" y="4" width="3" height="18" rx="0.5"/><rect x="19" y="10" width="3" height="12" rx="0.5"/><line x1="13" y1="9" x2="16" y2="9"/><line x1="13" y1="14" x2="16" y2="14"/><line x1="13" y1="19" x2="16" y2="19"/></svg>''',

    "decomposicao/abaco.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="6" y1="4" x2="6" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="18" y1="4" x2="18" y2="20"/><circle cx="6" cy="8" r="1.5" fill="currentColor"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/><circle cx="18" cy="7" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/></svg>''',

    "decomposicao/valor-posicional.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="6" height="10" rx="1"/><rect x="9" y="7" width="6" height="10" rx="1"/><rect x="16" y="7" width="6" height="10" rx="1"/><line x1="2" y1="20" x2="22" y2="20"/><text x="5" y="14" font-size="5" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif">C</text><text x="12" y="14" font-size="5" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif">D</text><text x="19" y="14" font-size="5" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif">U</text></svg>''',

    # ==========================================================
    # COMPARACAO (maior/menor, comparar grupos)
    # ==========================================================
    "comparacao/duas-colunas.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="16" rx="1"/><rect x="14" y="8" width="7" height="12" rx="1"/><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/></svg>''',

    "comparacao/comparar-grupos.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="1.5" fill="currentColor"/><circle cx="10" cy="6" r="1.5" fill="currentColor"/><circle cx="5" cy="11" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="15" cy="8" r="1.5" fill="currentColor"/><circle cx="20" cy="8" r="1.5" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/><line x1="3" y1="18" x2="21" y2="18"/></svg>''',

    "comparacao/sinal-maior.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 5 6 12 16 19"/></svg>''',

    "comparacao/sinal-menor.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 5 18 12 8 19"/></svg>''',

    "comparacao/sinal-igual.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/></svg>''',

    "comparacao/maior-menor.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 6 9 12 5 18"/><polyline points="19 6 15 12 19 18"/><line x1="11" y1="4" x2="11" y2="20" stroke-dasharray="2 2"/><line x1="13" y1="4" x2="13" y2="20" stroke-dasharray="2 2"/></svg>''',

    # ==========================================================
    # SEQUENCIA (reta numerica, padrao, ciclo)
    # ==========================================================
    "sequencia/seta-sequencia.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="4" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="20" cy="12" r="2" fill="currentColor"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="18" y2="12"/><polyline points="9 9 12 12 9 15"/><polyline points="17 9 20 12 17 15"/></svg>''',

    "sequencia/padrao-geometrico.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="5" height="5"/><circle cx="11" cy="12" r="2.5"/><path d="M17 14.5 L20.5 9 L24 14.5 Z" stroke-width="1.5"/><line x1="2" y1="19" x2="22" y2="19" stroke-dasharray="3 2"/></svg>''',

    "sequencia/serie-numerica.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/><line x1="6" y1="8" x2="6" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="18" y1="8" x2="18" y2="16"/></svg>''',

    "sequencia/escada-numerica.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h4v-4h4v-4h4v-4h4V5"/><line x1="3" y1="21" x2="21" y2="21"/><circle cx="5" cy="19" r="0.8" fill="currentColor"/><circle cx="9" cy="15" r="0.8" fill="currentColor"/><circle cx="13" cy="11" r="0.8" fill="currentColor"/><circle cx="17" cy="7" r="0.8" fill="currentColor"/></svg>''',

    "sequencia/linha-tempo.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="13" y1="8" x2="13" y2="16"/><line x1="19" y1="8" x2="19" y2="16"/><polyline points="3 12 1 10 M3 12 1 14"/></svg>''',

    "sequencia/ciclo.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>''',

    # ==========================================================
    # GENERICOS EXTRAS (dado, moeda, presente, trofeu)
    # ==========================================================
    "genericos/dado.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>''',

    "genericos/moeda.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><text x="12" y="16" font-size="9" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif" font-weight="bold">R$</text></svg>''',

    "genericos/presente.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="13" rx="1"/><line x1="12" y1="8" x2="12" y2="21"/><path d="M12 8c-3 0-4-2-4-3s1-3 2-3 2 1 2 3c0-2 1-3 2-3s3 1 3 3-2 3-5 3z"/></svg>''',

    "genericos/trofeu.svg": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h12v6a6 6 0 0 1-12 0V4z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="15" x2="12" y2="20"/></svg>''',
}


def main():
    print("=" * 70)
    print("  CRIACAO DOS SVGS PEDAGOGICOS — Fase 3")
    print("=" * 70)
    print(f"\nDestino: {ICONS_DIR}")

    if not ICONS_DIR.exists():
        print(f"\n[ERRO] Pasta nao encontrada: {ICONS_DIR}")
        sys.exit(1)

    criados = 0
    existentes = 0
    erros = 0

    for rel_path, svg_content in SVGS.items():
        full_path = ICONS_DIR / rel_path
        try:
            full_path.parent.mkdir(parents=True, exist_ok=True)
            if full_path.exists():
                print(f"  [SKIP] {rel_path} (ja existe)")
                existentes += 1
                continue
            full_path.write_text(svg_content, encoding="utf-8")
            print(f"  [OK]   {rel_path}")
            criados += 1
        except Exception as e:
            print(f"  [ERRO] {rel_path}: {e}")
            erros += 1

    print("\n" + "=" * 70)
    print(f"  RESULTADO")
    print("=" * 70)
    print(f"  SVGs criados:    {criados}")
    print(f"  Ja existiam:     {existentes}")
    print(f"  Erros:           {erros}")
    print("=" * 70)


if __name__ == "__main__":
    main()