from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ..models.theme_config import ThemeConfig
from ..schemas.theme_config import (
    ThemeConfigSchema,
    get_default_theme_config,
)


# ============================================================
# LER CONFIGURAÇÃO (auto-corrige se necessário)
# ============================================================
def get_theme_config(db: Session) -> ThemeConfig:
    """
    Retorna a configuração de tema do SIMIDNAPE.

    Comportamento:
    1. Se não existir nenhuma, cria com defaults.
    2. Se existir mas estiver desatualizada, faz merge com defaults.
    3. Se estiver corrompida, reseta para defaults.
    """
    config_row = db.query(ThemeConfig).first()

    if not config_row:
        defaults = get_default_theme_config()
        config_row = ThemeConfig(config=defaults)
        db.add(config_row)
        db.commit()
        db.refresh(config_row)
        return config_row

    config_atual = config_row.config or {}

    try:
        defaults = get_default_theme_config()
        merged = _deep_merge(defaults, config_atual)
        validated = ThemeConfigSchema(**merged)
        config_limpa = validated.model_dump()

        if config_limpa != config_atual:
            config_row.config = config_limpa
            db.commit()
            db.refresh(config_row)
            print(f"[Theme] Config auto-corrigida (merge com defaults).")

    except Exception as e:
        print(f"[Theme] Config inválida ({e}), resetando para defaults.")
        config_row.config = get_default_theme_config()
        db.commit()
        db.refresh(config_row)

    return config_row


# ============================================================
# ATUALIZAR CONFIGURAÇÃO
# ============================================================
def update_theme_config(
    db: Session,
    new_config: Dict[str, Any],
    updated_by: Optional[str] = None,
) -> ThemeConfig:
    """
    Atualiza a configuração de tema.
    Faz merge com a config existente para não perder campos.
    """
    config_row = get_theme_config(db)

    config_atual = dict(config_row.config or {})
    merged = _deep_merge(config_atual, new_config)

    try:
        validated = ThemeConfigSchema(**merged)
        config_row.config = validated.model_dump()
    except Exception as e:
        print(f"[Theme] Aviso: config inválida, salvando como veio. Erro: {e}")
        config_row.config = merged

    if updated_by:
        config_row.updated_by = updated_by

    db.commit()
    db.refresh(config_row)
    return config_row


# ============================================================
# RESETAR PARA O PADRÃO
# ============================================================
def reset_theme_config(db: Session, updated_by: Optional[str] = None) -> ThemeConfig:
    """Reseta a configuração de tema para os valores padrão."""
    config_row = get_theme_config(db)
    config_row.config = get_default_theme_config()
    if updated_by:
        config_row.updated_by = updated_by
    db.commit()
    db.refresh(config_row)
    return config_row


# ============================================================
# HELPER — MERGE PROFUNDO
# ============================================================
def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """Faz merge profundo de dois dicionários (mesma regra do landing_service)."""
    if not isinstance(base, dict):
        return override if override is not None else base
    if not isinstance(override, dict):
        return override

    resultado = dict(base)
    for key, value in override.items():
        if key not in resultado:
            resultado[key] = value
            continue

        base_value = resultado[key]

        if isinstance(base_value, dict) and isinstance(value, dict):
            resultado[key] = _deep_merge(base_value, value)
        elif isinstance(base_value, dict) and not isinstance(value, dict):
            pass
        elif isinstance(base_value, list) and not isinstance(value, list):
            pass
        else:
            resultado[key] = value

    return resultado