"""
Script para extrair texto do PDF do Currículo do Piauí.
Gera um arquivo .txt com todo o texto bruto do PDF.

Rodar UMA VEZ. Depois podemos analisar o conteúdo.
"""
from pypdf import PdfReader
from pathlib import Path
import sys
import time

# ============================================================
# CAMINHO DO PDF (caminho completo no seu computador)
# ============================================================
PDF_PATH = Path(r"C:\Users\Darilson Cornelio\Documents\SIMIDNAPE anotações\curriculo_piaui.pdf.pdf")

# ============================================================
# ONDE SALVAR O TEXTO EXTRAÍDO
# ============================================================
OUTPUT_TXT = Path(__file__).parent / "curriculo_piaui.txt"


def main():
    if not PDF_PATH.exists():
        print(f"ERRO: PDF não encontrado em:\n{PDF_PATH}")
        print("Verifique o caminho exato do arquivo.")
        sys.exit(1)

    print(f"Abrindo PDF: {PDF_PATH}")
    print(f"Tamanho: {PDF_PATH.stat().st_size / (1024*1024):.1f} MB")
    print("")

    leitor = PdfReader(str(PDF_PATH))
    total_paginas = len(leitor.pages)
    print(f"Total de páginas: {total_paginas}")
    print("Extraindo texto... (isso pode levar 1-2 minutos)")
    print("")

    inicio = time.time()
    texto_completo = []

    for i, pagina in enumerate(leitor.pages, start=1):
        try:
            texto = pagina.extract_text() or ""
            texto_completo.append(f"\n\n===== PAGINA {i} =====\n\n{texto}")
        except Exception as e:
            print(f"[Aviso] Erro na página {i}: {e}")
            texto_completo.append(f"\n\n===== PAGINA {i} (ERRO) =====\n\n")

        # Progresso a cada 50 páginas
        if i % 50 == 0:
            print(f"  → {i}/{total_paginas} páginas processadas...")

    texto_final = "".join(texto_completo)
    OUTPUT_TXT.write_text(texto_final, encoding="utf-8")

    duracao = time.time() - inicio
    tamanho_mb = OUTPUT_TXT.stat().st_size / (1024 * 1024)
    print("")
    print(f"OK: Texto extraído com sucesso!")
    print(f"  → Arquivo: {OUTPUT_TXT}")
    print(f"  → Tamanho: {tamanho_mb:.1f} MB")
    print(f"  → Tempo: {duracao:.1f}s")


if __name__ == "__main__":
    main()