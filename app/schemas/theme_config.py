from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


# ============================================================
# TEMA — cores e fontes editáveis pelo super admin
# ============================================================

class ThemeColors(BaseModel):
    """Paleta oficial do SIMIDNAPE — 9 cores controladas pelo admin."""
    primary:        str = "#F59E0B"   # Botões principais / CTAs (âmbar)
    accent:         str = "#2C5F7C"   # Destaques, badges, kickers (azul-sereno)
    bg_light:       str = "#FDFBF7"   # Fundo das seções claras (creme)
    bg_dark:        str = "#1E3A4C"   # Fundo das seções escuras (petróleo)
    text_primary:   str = "#1F2937"   # Texto principal (grafite)
    text_secondary: str = "#4B5563"   # Texto secundário (grafite suave)
    success:        str = "#7FA88D"   # Checks, reforço positivo (verde suave)
    warning:        str = "#E07856"   # Cards "Antes", alertas (coral)
    highlight:      str = "#D4A843"   # Selos, dourado de destaque (ouro)


class ThemeFonts(BaseModel):
    """Fontes oficiais do SIMIDNAPE — 3 famílias controladas pelo admin."""
    font_heading: str = "Quicksand"   # Títulos (h1, h2, h3)
    font_body:    str = "Inter"       # Corpo do texto
    font_accent:  str = "Lora"        # Slogan, citações, badges


class ThemeConfigSchema(BaseModel):
    colors: ThemeColors = Field(default_factory=ThemeColors)
    fonts:  ThemeFonts  = Field(default_factory=ThemeFonts)


class ThemeConfigOut(BaseModel):
    id: UUID
    config: ThemeConfigSchema
    updated_at: Optional[datetime]
    updated_by: Optional[UUID]

    class Config:
        from_attributes = True


def get_default_theme_config() -> dict:
    return ThemeConfigSchema().model_dump()