from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ..models.landing_config import LandingConfig
from ..schemas.landing_config import (
    LandingConfigSchema,
    get_default_landing_config,
)


# ============================================================
# LER CONFIGURAÇÃO (auto-corrige se necessário)
# ============================================================
def get_landing_config(db: Session) -> LandingConfig:
    """
    Retorna a configuração da landing page.

    Comportamento:
    1. Se não existir nenhuma, cria com defaults.
    2. Se existir mas estiver desatualizada (formato antigo, campos
       faltando), faz merge com defaults e re-salva.
    3. Se estiver corrompida, reseta para defaults.

    Isso garante que o frontend NUNCA receba uma config incompatível.
    """
    config_row = db.query(LandingConfig).first()

    # Caso 1: não existe → cria com defaults
    if not config_row:
        defaults = get_default_landing_config()
        config_row = LandingConfig(config=defaults)
        db.add(config_row)
        db.commit()
        db.refresh(config_row)
        return config_row

    # Caso 2: existe → valida e corrige
    config_atual = config_row.config or {}

    try:
        # 2a. Faz merge profundo dos defaults com o que está no banco
        #     (garante que campos novos entrem)
        defaults = get_default_landing_config()
        merged = _deep_merge(defaults, config_atual)

        # 2b. Valida com o schema (auto-corrige tipos errados via defaults)
        validated = LandingConfigSchema(**merged)
        config_limpa = validated.model_dump()

        # 2c. Se o resultado for diferente do que estava no banco,
        #     atualiza (isso conserta automaticamente)
        if config_limpa != config_atual:
            config_row.config = config_limpa
            db.commit()
            db.refresh(config_row)
            print(f"[Landing] Config auto-corrigida (merge com defaults).")

    except Exception as e:
        # Caso 3: falhou de tudo → reseta para os defaults
        print(f"[Landing] Config inválida ({e}), resetando para defaults.")
        config_row.config = get_default_landing_config()
        db.commit()
        db.refresh(config_row)

    return config_row


# ============================================================
# ATUALIZAR CONFIGURAÇÃO
# ============================================================
def update_landing_config(
    db: Session,
    new_config: Dict[str, Any],
    updated_by: Optional[str] = None,
) -> LandingConfig:
    """
    Atualiza a configuração da landing page.
    Faz merge dos dados enviados com a config existente (para não perder campos).
    """
    config_row = get_landing_config(db)

    config_atual = dict(config_row.config or {})
    merged = _deep_merge(config_atual, new_config)

    try:
        validated = LandingConfigSchema(**merged)
        config_row.config = validated.model_dump()
    except Exception as e:
        print(f"[Landing] Aviso: config inválida, salvando como veio. Erro: {e}")
        config_row.config = merged

    if updated_by:
        config_row.updated_by = updated_by

    db.commit()
    db.refresh(config_row)
    return config_row


# ============================================================
# RESETAR PARA O PADRÃO
# ============================================================
def reset_landing_config(db: Session, updated_by: Optional[str] = None) -> LandingConfig:
    """Reseta a configuração da landing para os valores padrão."""
    config_row = get_landing_config(db)
    config_row.config = get_default_landing_config()
    if updated_by:
        config_row.updated_by = updated_by
    db.commit()
    db.refresh(config_row)
    return config_row


# ============================================================
# HELPER — MERGE PROFUNDO
# ============================================================
def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """
    Faz merge profundo de dois dicionários.

    Regras:
    - Se ambos são dicts → faz merge recursivo
    - Se um dos dois é lista → usa `override` (não mescla listas)
    - Se tipos diferentes → usa `override`

    Isso garante que:
    - Campos novos do `base` (defaults) sejam adicionados
    - Campos existentes do `override` (banco) sejam preservados
    - Listas antigas sejam substituídas pelas novas quando conflitam
    """
    if not isinstance(base, dict):
        return override if override is not None else base
    if not isinstance(override, dict):
        return override

    resultado = dict(base)
    for key, value in override.items():
        # Se override não tem essa chave, pula
        if key not in resultado:
            resultado[key] = value
            continue

        base_value = resultado[key]

        # Ambos são dicts → merge recursivo
        if isinstance(base_value, dict) and isinstance(value, dict):
            resultado[key] = _deep_merge(base_value, value)
        # Tipo diferente (ex: string vs dict) → usa o default (base)
        elif isinstance(base_value, dict) and not isinstance(value, dict):
            # Mantém o default porque o override está no formato antigo
            pass
        elif isinstance(base_value, list) and not isinstance(value, list):
            pass
        # Mesmo tipo → usa o override
        else:
            resultado[key] = value

    return resultado