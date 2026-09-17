from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class AnnouncementCreate(BaseModel):
    title: str
    message: str
    tipo: Optional[str] = "info"  # info, aviso, sucesso
    target_user_id: Optional[UUID] = None  # nulo = todos


class AnnouncementOut(BaseModel):
    id: UUID
    author_id: UUID
    target_user_id: Optional[UUID]
    title: str
    message: str
    tipo: str
    read: bool
    active: bool
    created_at: datetime
    # Nome do destinatário (opcional, para listagem admin)
    target_user_name: Optional[str] = None

    class Config:
        from_attributes = True