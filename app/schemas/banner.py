from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class BannerCreate(BaseModel):
    titulo: Optional[str] = None
    texto: str
    imagem_perfil: Optional[str] = None
    tipo_midia: Optional[str] = "nenhuma"  # nenhuma, imagem, video, embed_instagram, embed_tiktok, embed_facebook
    imagem_url: Optional[str] = None
    link_url: Optional[str] = None
    telefone: Optional[str] = None


class BannerUpdate(BaseModel):
    titulo: Optional[str] = None
    texto: Optional[str] = None
    imagem_perfil: Optional[str] = None
    tipo_midia: Optional[str] = None
    imagem_url: Optional[str] = None
    link_url: Optional[str] = None
    telefone: Optional[str] = None
    ativo: Optional[bool] = None


class BannerOut(BaseModel):
    id: UUID
    titulo: Optional[str]
    texto: str
    imagem_perfil: Optional[str]
    tipo_midia: str
    imagem_url: Optional[str]
    link_url: Optional[str]
    telefone: Optional[str]
    ativo: bool
    created_at: datetime

    class Config:
        from_attributes = True