from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ..models.landing_config import LandingConfig
from ..schemas.landing_config import (
    LandingConfigSchema,
    get_default_landing_config,
)


# ============================================================
# LER CONFIGURAÇÃO (cria default se não existir)
# ============================================================
def get_landing_config(db: Session) -> LandingConfig:
    """
    Retorna a configuração da landing page.
    Se não existir nenhuma no banco, cria automaticamente com os defaults.
    """
    config_row = db.query(LandingConfig).first()

    if not config_row:
        # Cria com os defaults
        defaults = get_default_landing_config()
        config_row = LandingConfig(config=defaults)
        db.add(config_row)
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

    # Merge profundo: mantém campos não enviados
    config_atual = dict(config_row.config or {})
    merged = _deep_merge(config_atual, new_config)

    # Valida com o schema Pydantic (garante estrutura correta)
    try:
        validated = LandingConfigSchema(**merged)
        config_row.config = validated.model_dump()
    except Exception as e:
        # Se falhar a validação, salva mesmo assim (o admin vê o erro no frontend)
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
# HELPERS
# ============================================================
def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """
    Faz merge profundo de dois dicionários.
    Valores de `override` sobrepõem os de `base`, mas chaves que só existem
    em `base` são preservadas.
    """
    if not isinstance(base, dict):
        base = {}
    if not isinstance(override, dict):
        return override

    resultado = dict(base)
    for key, value in override.items():
        if (
            key in resultado
            and isinstance(resultado[key], dict)
            and isinstance(value, dict)
        ):
            resultado[key] = _deep_merge(resultado[key], value)
        else:
            resultado[key] = value
    return resultado