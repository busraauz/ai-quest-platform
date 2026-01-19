from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Document(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    filename: str
    storage_path: str
    mime_type: str = "application/pdf"
    extracted_text: Optional[str] = None
    status: str = "ready"
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
