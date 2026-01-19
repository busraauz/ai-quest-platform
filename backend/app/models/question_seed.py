from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class QuestionSeed(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    input_mode: Literal["text", "image"]
    seed_text: Optional[str] = None
    seed_image_path: Optional[str] = None
    seed_image_mime: Optional[str] = None
    seed_image_size: Optional[int] = None
    extracted_text: Optional[str] = None
    analysis: Optional[dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
