"""
Script temporário: investiga o que a biblioteca `bncc` retorna
para habilidades de diferentes componentes.

Roda UMA VEZ para diagnóstico. Depois pode ser apagado.
"""
import json
import bncc


def mostrar(titulo, dados):
    print(f"\n{'='*60}")
    print(f"  {titulo}")
    print(f"{'='*60}")
    try:
        print(json.dumps(dados, ensure_ascii=False, indent=2, default=str))
    except Exception as e:
        print(f"Erro ao imprimir: {e}")
        print(dados)


def main():
    # ============================================================
    # 1. Testar habilidade de Matemática (EF02MA01)
    # ============================================================
    print("\n\n🔍 TESTE 1: EF02MA01 (Matemática 2º ano)")
    try:
        h = bncc.por_codigo("EF02MA01")
        mostrar("Retorno bruto", h)
    except Exception as e:
        print(f"Erro: {e}")

    # ============================================================
    # 2. Testar habilidade de Língua Portuguesa (EF02LP01)
    # ============================================================
    print("\n\n🔍 TESTE 2: EF02LP01 (Língua Portuguesa 2º ano)")
    try:
        h = bncc.por_codigo("EF02LP01")
        mostrar("Retorno bruto", h)
    except Exception as e:
        print(f"Erro: {e}")

    # ============================================================
    # 3. Testar habilidade de Ensino Religioso (EF01ER01)
    # ============================================================
    print("\n\n🔍 TESTE 3: EF01ER01 (Ensino Religioso 1º ano)")
    try:
        h = bncc.por_codigo("EF01ER01")
        mostrar("Retorno bruto", h)
    except Exception as e:
        print(f"Erro: {e}")

    # ============================================================
    # 4. Testar o que a biblioteca oferece de métodos públicos
    # ============================================================
    print("\n\n🔍 TESTE 4: Métodos/funções disponíveis na biblioteca `bncc`")
    try:
        metodos = [m for m in dir(bncc) if not m.startswith("_")]
        print(f"  Total: {len(metodos)}")
        print(f"  Métodos:")
        for m in metodos:
            print(f"    - {m}")
    except Exception as e:
        print(f"Erro: {e}")

    # ============================================================
    # 5. Testar listar habilidades EF (para ver se traz unidade_tematica)
    # ============================================================
    print("\n\n🔍 TESTE 5: Listar 3 habilidades EF")
    try:
        lista = bncc.habilidades_ef(componente="MA", ano=2)
        print(f"Total retornado: {len(lista) if lista else 0}")
        if lista and len(lista) > 0:
            print(f"\n📌 Exemplo do PRIMEIRO item da lista:")
            mostrar("Primeira habilidade", lista[0])
            print(f"\n📌 Chaves disponíveis no primeiro item:")
            print(f"  {list(lista[0].keys())}")
    except Exception as e:
        print(f"Erro: {e}")

    print("\n\n✅ Investigação concluída.\n")


if __name__ == "__main__":
    main()