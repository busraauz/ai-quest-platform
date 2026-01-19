from __future__ import annotations

from typing import Any, Dict, Optional, cast
from uuid import UUID

from app.db.client import get_supabase_client
from app.models.question_seed import QuestionSeed  # <-- adjust import to your project


def insert_question_seed(
    *,
    user_id: UUID,
    session_id: UUID,
    seed_text: Optional[str] = None,
    seed_image_path: Optional[str] = None,
    seed_image_mime: Optional[str] = None,
    seed_image_size: Optional[int] = None,
    extracted_text: Optional[str] = None,
    analysis: Optional[Dict[str, Any]] = None,
) -> QuestionSeed:
    """
    Inserts a new question_seed row. Supports text, image, or both.
    Returns inserted row.
    """
    sb = get_supabase_client()

    payload: Dict[str, Any] = {
        "user_id": str(user_id),
        "session_id": str(session_id),
        "seed_text": seed_text,
        "input_mode": "image" if seed_image_path else "text",
        "seed_image_path": seed_image_path,
        "seed_image_mime": seed_image_mime,
        "seed_image_size": seed_image_size,
        "extracted_text": extracted_text,
        "analysis": analysis,
    }

    res = sb.table("question_seeds").insert(payload).execute()
    if not res.data:
        raise RuntimeError("Failed to insert question_seed (no rows returned).")
    return QuestionSeed.model_validate(res.data[0])


def update_question_seed(seed_id: UUID, patch: Dict[str, Any]) -> None:
    """
    Partial update for seed row. Example patch:
      {"seed_image_path": "...", "analysis": {...}}
    """
    sb = get_supabase_client()
    sb.table("question_seeds").update(patch).eq("id", str(seed_id)).execute()


def delete_question_seed(*, seed_id: UUID) -> None:
    sb = get_supabase_client()
    sb.table("question_seeds").delete().eq("id", str(seed_id)).execute()
