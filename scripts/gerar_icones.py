"""
Gera 30 ícones SVG essenciais para o Motor 9 (Matemática - Fase A).
Roda UMA VEZ. Cria os arquivos em frontend/public/icons/.
"""
from pathlib import Path

BASE = Path(__file__).parent.parent / "frontend" / "public" / "icons"

# ============================================================
# NÚMEROS (11)
# ============================================================
def numero_svg(n, cor="#3b82f6"):
    return f'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="{cor}"/><text x="50" y="70" font-family="Arial,sans-serif" font-size="60" font-weight="bold" fill="#ffffff" text-anchor="middle">{n}</text></svg>'

NUMEROS = {
    "1": numero_svg(1, "#3b82f6"),
    "2": numero_svg(2, "#10b981"),
    "3": numero_svg(3, "#f59e0b"),
    "4": numero_svg(4, "#ef4444"),
    "5": numero_svg(5, "#8b5cf6"),
    "6": numero_svg(6, "#06b6d4"),
    "7": numero_svg(7, "#ec4899"),
    "8": numero_svg(8, "#84cc16"),
    "9": numero_svg(9, "#f97316"),
    "10": f'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#6366f1"/><text x="50" y="68" font-family="Arial,sans-serif" font-size="50" font-weight="bold" fill="#ffffff" text-anchor="middle">10</text></svg>',
    "reta-numerica": '<svg viewBox="0 0 220 60" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="40" x2="210" y2="40" stroke="#1e293b" stroke-width="2"/><line x1="10" y1="34" x2="10" y2="46" stroke="#1e293b" stroke-width="2"/><text x="10" y="30" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1e293b">0</text><line x1="60" y1="34" x2="60" y2="46" stroke="#1e293b" stroke-width="2"/><text x="60" y="30" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1e293b">1</text><line x1="110" y1="34" x2="110" y2="46" stroke="#1e293b" stroke-width="2"/><text x="110" y="30" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1e293b">2</text><line x1="160" y1="34" x2="160" y2="46" stroke="#1e293b" stroke-width="2"/><text x="160" y="30" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1e293b">3</text><line x1="210" y1="34" x2="210" y2="46" stroke="#1e293b" stroke-width="2"/><text x="210" y="30" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" fill="#1e293b">4</text></svg>',
}

# ============================================================
# FORMAS GEOMÉTRICAS (8)
# ============================================================
FORMAS = {
    "quadrado": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="15" width="70" height="70" fill="#ef4444" stroke="#991b1b" stroke-width="2" rx="4"/></svg>',
    "circulo": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="35" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/></svg>',
    "triangulo": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 90,85 10,85" fill="#f59e0b" stroke="#b45309" stroke-width="2"/></svg>',
    "retangulo": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="25" width="80" height="50" fill="#10b981" stroke="#047857" stroke-width="2" rx="4"/></svg>',
    "losango": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 90,50 50,90 10,50" fill="#8b5cf6" stroke="#5b21b6" stroke-width="2"/></svg>',
    "estrela": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,8 61,38 93,38 67,57 77,88 50,70 23,88 33,57 7,38 39,38" fill="#fbbf24" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/></svg>',
    "coracao": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,85 C20,65 10,50 10,35 C10,22 22,15 32,15 C40,15 47,20 50,27 C53,20 60,15 68,15 C78,15 90,22 90,35 C90,50 80,65 50,85 Z" fill="#ec4899" stroke="#9d174d" stroke-width="2"/></svg>',
    "hexagono": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 87,30 87,70 50,90 13,70 13,30" fill="#06b6d4" stroke="#155e75" stroke-width="2"/></svg>',
}

# ============================================================
# OBJETOS ESCOLARES (6)
# ============================================================
OBJETOS = {
    "lapis": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="15,85 25,75 80,20 70,10" fill="#fbbf24" stroke="#92400e" stroke-width="2"/><polygon points="15,85 25,75 20,70" fill="#1e293b"/><polygon points="70,10 80,20 85,15 75,5" fill="#f87171" stroke="#991b1b" stroke-width="1"/></svg>',
    "caderno": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="15" width="60" height="75" fill="#ffffff" stroke="#1e293b" stroke-width="2"/><rect x="20" y="15" width="8" height="75" fill="#3b82f6"/><line x1="35" y1="30" x2="75" y2="30" stroke="#94a3b8" stroke-width="1.5"/><line x1="35" y1="42" x2="75" y2="42" stroke="#94a3b8" stroke-width="1.5"/><line x1="35" y1="54" x2="75" y2="54" stroke="#94a3b8" stroke-width="1.5"/><line x1="35" y1="66" x2="65" y2="66" stroke="#94a3b8" stroke-width="1.5"/></svg>',
    "borracha": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="35" width="60" height="30" rx="4" fill="#ec4899" stroke="#9d174d" stroke-width="2"/><rect x="20" y="35" width="20" height="30" rx="4" fill="#fbbf24" stroke="#92400e" stroke-width="2"/></svg>',
    "regua": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="40" width="80" height="20" fill="#fde68a" stroke="#92400e" stroke-width="2"/><line x1="20" y1="40" x2="20" y2="50" stroke="#1e293b" stroke-width="1.5"/><line x1="30" y1="40" x2="30" y2="55" stroke="#1e293b" stroke-width="1.5"/><line x1="40" y1="40" x2="40" y2="50" stroke="#1e293b" stroke-width="1.5"/><line x1="50" y1="40" x2="50" y2="55" stroke="#1e293b" stroke-width="1.5"/><line x1="60" y1="40" x2="60" y2="50" stroke="#1e293b" stroke-width="1.5"/><line x1="70" y1="40" x2="70" y2="55" stroke="#1e293b" stroke-width="1.5"/><line x1="80" y1="40" x2="80" y2="50" stroke="#1e293b" stroke-width="1.5"/></svg>',
    "tesoura": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="30" r="10" fill="none" stroke="#1e293b" stroke-width="3"/><circle cx="25" cy="70" r="10" fill="none" stroke="#1e293b" stroke-width="3"/><line x1="33" y1="35" x2="85" y2="60" stroke="#64748b" stroke-width="3"/><line x1="33" y1="65" x2="85" y2="40" stroke="#64748b" stroke-width="3"/></svg>',
    "mochila": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M25,40 C25,20 40,15 50,15 C60,15 75,20 75,40 L75,80 L25,80 Z" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/><rect x="40" y="55" width="20" height="15" fill="#1e40af" rx="3"/><rect x="30" y="15" width="8" height="15" fill="#1e40af"/><rect x="62" y="15" width="8" height="15" fill="#1e40af"/></svg>',
}

# ============================================================
# OBJETOS GENÉRICOS (5)
# ============================================================
GENERICOS = {
    "bola": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="38" fill="#ef4444" stroke="#991b1b" stroke-width="2"/><path d="M50,12 Q55,50 50,88" fill="none" stroke="#ffffff" stroke-width="2"/><path d="M12,50 Q50,45 88,50" fill="none" stroke="#ffffff" stroke-width="2"/></svg>',
    "carrinho": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10,60 L20,35 L75,35 L85,60 L10,60 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2"/><rect x="30" y="28" width="30" height="10" fill="#3b82f6" stroke="#1e40af" stroke-width="1.5"/><circle cx="30" cy="72" r="10" fill="#1e293b"/><circle cx="70" cy="72" r="10" fill="#1e293b"/><circle cx="30" cy="72" r="4" fill="#94a3b8"/><circle cx="70" cy="72" r="4" fill="#94a3b8"/></svg>',
    "balao": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><ellipse cx="50" cy="40" rx="28" ry="32" fill="#ec4899" stroke="#9d174d" stroke-width="2"/><polygon points="46,72 54,72 50,80" fill="#9d174d"/><path d="M50,80 Q55,88 48,95" fill="none" stroke="#1e293b" stroke-width="1.5"/></svg>',
    "maca": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,30 C40,20 25,25 25,45 C25,65 40,85 50,85 C60,85 75,65 75,45 C75,25 60,20 50,30 Z" fill="#ef4444" stroke="#991b1b" stroke-width="2"/><path d="M50,30 Q50,20 55,15" fill="none" stroke="#78350f" stroke-width="2"/><path d="M55,18 Q65,15 68,20 Q65,25 55,22 Z" fill="#16a34a"/></svg>',
    "livro": '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,25 Q30,20 15,25 L15,80 Q30,75 50,80 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/><path d="M50,25 Q70,20 85,25 L85,80 Q70,75 50,80 Z" fill="#f59e0b" stroke="#92400e" stroke-width="2"/><line x1="50" y1="25" x2="50" y2="80" stroke="#92400e" stroke-width="2"/></svg>',
}


# ============================================================
# MAIN
# ============================================================
def main():
    pastas = {
        "numeros": NUMEROS,
        "formas": FORMAS,
        "objetos": OBJETOS,
        "genericos": GENERICOS,
    }

    total = 0
    for pasta, conteudo in pastas.items():
        dir_destino = BASE / pasta
        dir_destino.mkdir(parents=True, exist_ok=True)

        for nome, svg in conteudo.items():
            caminho = dir_destino / f"{nome}.svg"
            caminho.write_text(svg, encoding="utf-8")
            total += 1

    print(f"OK: {total} ícones gerados em {BASE}")
    for pasta in pastas.keys():
        qtd = len(pastas[pasta])
        print(f"  {pasta}/: {qtd} arquivo(s)")


if __name__ == "__main__":
    main()