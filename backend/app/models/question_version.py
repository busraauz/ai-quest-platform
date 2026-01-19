from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class QuestionVersion(BaseModel):
    id: UUID
    question_id: UUID
    user_id: UUID
    version: int
    instruction: str
    content: dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
