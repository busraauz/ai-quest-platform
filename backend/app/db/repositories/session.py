from uuid import UUID
from typing import Dict, Literal, Optional

from supabase import Client

from app.db.client import get_supabase_client
from app.models.session import Session
from app.schemas.document import QuestionType
from app.schemas.similar import Difficulty


def create_session(
    user_id: UUID,
    title: Optional[str] = None,
    source_type: Optional[Literal["document", "similarity"]] = None,
    question_type: Optional[QuestionType] = "mcq",
    quantity: int = 10,
    difficulty: Optional[Difficulty] = None,
    supabase: Client | None = None,
) -> Session:
    sb = supabase or get_supabase_client()
    payload = {
        "user_id": str(user_id),
        "title": "",
        "source_type": source_type,
        "question_type": question_type,
        "quantity": quantity,
        "difficulty": difficulty,
    }
    res = sb.table("sessions").insert(payload).execute()
    if not res.data:
        raise RuntimeError(f"Failed to create session: {res}")
    return Session.model_validate(res.data[0])
