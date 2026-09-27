"""
Baixa SVGs pedagógicos do Tabler Icons, organizados por contexto visual.

Fontes:
  - Tabler Icons (https://tabler.io/icons) - MIT License
  - CDN: jsDelivr (https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons/)

Idempotente: não rebaixa arquivos que já existem.
Rodar UMA VEZ com o venv ativado.
"""
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERRO: a biblioteca 'requests' não está instalada.")
    print("Rode: pip install requests")
    sys.exit(1)


# ============================================================
# CONFIGURAÇÃO
# ============================================================
RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "scripts" / "figuras_baixadas"

# URL base da CDN do Tabler Icons
CDN_BASE = "https://cdn.jsdelivr.net/npm/@tabler/icons@latest/icons"

# Mapa de contextos visuais -> lista de nomes de ícones do Tabler
# Foco em contextos com alta probabilidade de uso pedagógico.
CONTEXTOS = {
    "criancas_e_escola": [
        "school", "book", "pencil", "pen", "notebook", "backpack",
        "ruler", "scissors", "paperclip", "clipboard", "chalkboard",
        "teacher", "user", "users", "user-plus", "user-check",
        "baby-carriage", "toy-brick", "puzzle", "ball-basketball",
    ],
    "animais": [
        "dog", "cat", "fish", "bird", "rabbit", "horse", "cow",
        "pig", "sheep", "chicken", "elephant", "lion", "tiger",
        "monkey", "bear", "butterfly", "bug", "spider", "snail",
        "turtle", "frog", "whale", "dolphin", "paw",
    ],
    "alimentos": [
        "apple", "banana", "orange", "grape", "strawberry",
        "watermelon", "pineapple", "lemon", "cherry", "pear",
        "peach", "carrot", "tomato", "broccoli", "bread", "cake",
        "ice-cream", "pizza", "egg", "milk", "coffee", "tea",
    ],
    "formas_e_simbolos": [
        "circle", "square", "triangle", "rectangle", "star",
        "heart", "diamond", "hexagon", "pentagon", "oval",
        "plus", "minus", "x", "divide", "equal", "greater-than",
        "less-than", "arrow-up", "arrow-down", "arrow-left",
        "arrow-right", "check", "alert-circle", "info-circle",
    ],
    "elementos_graficos": [
        "chart-bar", "chart-pie", "chart-line", "chart-dots",
        "table", "grid", "list", "layout", "columns", "rows",
        "trending-up", "trending-down", "activity",
    ],
    "instrumentos": [
        "ruler", "scale", "thermometer", "clock", "stopwatch",
        "microscope", "telescope", "calculator", "bulb", "flask",
    ],
    "natureza": [
        "sun", "moon", "star", "cloud", "rain", "snow", "tree",
        "flower", "leaf", "mountain", "beach", "forest", "world",
        "planet", "globe",
    ],
    "mapas_e_cartografia": [
        "map", "compass", "globe", "pin", "location", "route",
        "navigation", "map-pin", "world", "flag",
    ],
    "transporte": [
        "car", "bus", "bicycle", "airplane", "boat", "train",
        "truck", "helicopter", "rocket", "scooter", "walk",
    ],
}


def baixar_icone(nome: str, contexto: str) -> bool:
    """Baixa um SVG do Tabler Icons. Retorna True se baixou, False se já existia ou falhou."""
    pasta = DESTINO / contexto
    pasta.mkdir(parents=True, exist_ok=True)
    destino = pasta / f"{nome}.svg"

    if destino.exists():
        print(f"  [SKIP] {contexto}/{nome}.svg (já existe)")
        return False

    # Tenta o formato outline
    url = f"{CDN_BASE}/outline/{nome}.svg"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200 and r.text.strip().startswith("<svg"):
            destino.write_text(r.text, encoding="utf-8")
            print(f"  [OK]   {contexto}/{nome}.svg")
            return True
    except Exception as e:
        print(f"  [ERRO] {contexto}/{nome}: {e}")

    return False


def main():
    print("=" * 70)
    print("  DOWNLOAD DE FIGURAS PEDAGÓGICAS — Tabler Icons")
    print("=" * 70)
    print(f"\nDestino: {DESTINO}\n")

    total_baixados = 0
    total_skipped = 0
    total_erros = 0

    for contexto, nomes in CONTEXTOS.items():
        print(f"\n📁 {contexto}/ ({len(nomes)} ícones)")
        for nome in nomes:
            resultado = baixar_icone(nome, contexto)
            if resultado is True:
                total_baixados += 1
            else:
                total_skipped += 1
            # Pequeno delay para não sobrecarregar a CDN
            time.sleep(0.1)

    print("\n" + "=" * 70)
    print("  RESULTADO")
    print("=" * 70)
    print(f"  SVGs baixados:    {total_baixados}")
    print(f"  Já existiam:      {total_skipped}")
    print(f"  Erros:            {total_erros}")
    print("=" * 70)
    print(f"\n✅ Figuras salvas em: {DESTINO}")
    print("   Próximo passo: fazer upload em massa pelo painel /admin/figure-bank")


if __name__ == "__main__":
    main()