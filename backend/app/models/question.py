from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Question(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    document_id: UUID
    source_type: Literal["document", "similarity"] = "document"
    question_type: Literal["mcq", "open"]
    question_text: str
    options: Optional[dict[str, Any]] = None
    correct_answer: str
    explanation: str
    tags: Optional[dict[str, Any]] = None
    confidence_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
