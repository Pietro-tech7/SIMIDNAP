from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    gemini_api_key = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())