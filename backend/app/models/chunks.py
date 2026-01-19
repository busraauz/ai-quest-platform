from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DocChunk(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
