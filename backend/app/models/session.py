from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

class Session(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    source_type: Literal["document", "similarity"] = "document"
    question_type: Literal["mcq", "open"] = "mcq"
    quantity: int = 10
    created_at: datetime = Field(default_factory=datetime.utcnow)
