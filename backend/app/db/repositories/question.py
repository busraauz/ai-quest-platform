from __future__ import annotations

from collections import defaultdict
from typing import Any, Dict, List, Literal, Optional, cast
from uuid import UUID
from app.db.client import get_supabase_client
from app.models.question import Question


def insert_questions(
    *,
    user_id: UUID,
    session_id: UUID,
    document_id: Optional[UUID] = None,
    questions: List[Dict[str, Any]],
    source_type: Literal["document", "similarity"] = "document",
) -> List[Dict[str, Any]]:
    sb = get_supabase_client()

    rows: List[Dict[str, Any]] = []
    for q in questions:
        rows.append(
            {
                "user_id": str(user_id),
                "session_id": str(session_id),
                "document_id": str(document_id) if document_id else None,
                "source_type": source_type,
                "question_type": q["question_type"],
                "question_text": q["question_text"],
                "options": q.get("options"),
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"],
                "tags": q.get("tags"),
                "confidence_score": q.get("confidence_score"),
            }
        )

    res = sb.table("questions").insert(rows).execute()
    data = cast(List[Dict[str, Any]], res.data or [])
    return data


def get_question_by_id(question_id: UUID) -> Optional[Dict[str, Any]]:
    sb = get_supabase_client()
    res = (
        sb.table("questions").select("*").eq("id", str(question_id)).limit(1).execute()
    )
    data = cast(list[dict[str, Any]], res.data or [])
    return data[0] if data else None


def get_latest_question_version(question_id: UUID) -> Optional[Dict[str, Any]]:
    sb = get_supabase_client()
    res = (
        sb.table("question_versions")
        .select("*")
        .eq("question_id", str(question_id))
        .order("version", desc=True)
        .limit(1)
        .execute()
    )
    data = cast(list[dict[str, Any]], res.data or [])
    return data[0] if data else None


def insert_question_version(
    *,
    question_id: UUID,
    user_id: UUID,
    version: int,
    instruction: str,
    content: Dict[str, Any],
) -> Dict[str, Any]:
    sb = get_supabase_client()
    res = (
        sb.table("question_versions")
        .insert(
            {
                "question_id": str(question_id),
                "user_id": str(user_id),
                "version": version,
                "instruction": instruction,
                "content": content,
            }
        )
        .execute()
    )
    res = (
        sb.table("question_versions")
        .select("*")
        .eq("question_id", str(question_id))
        .eq("version", version)
        .limit(1)
        .execute()
    )
    rows = cast(list[dict[str, Any]], res.data or [])

    return rows[0]


def get_recent_questions(user_id: str) -> List[Dict[str, Any]]:
    sb = get_supabase_client()
    res = (
        sb.table("questions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(200)
        .execute()
    )
    rows = cast(List[Dict[str, Any]], res.data or [])

    groups: dict[str, list[Dict[str, Any]]] = defaultdict(list)
    for q in rows:
        groups[q["session_id"]].append(q)

    sessions = [
        {
            "session_id": sid,
            "question_type": qs[0]["question_type"],
            "quantity": len(qs),
            "created_at": qs[0]["created_at"],
            "source_type": qs[0]["source_type"],
            "questions": qs,
        }
        for sid, qs in groups.items()
    ]
    sessions.sort(key=lambda s: s["created_at"], reverse=True)
    return sessions


def get_questions_by_session(session_id: str) -> List[Dict[str, Any]]:
    sb = get_supabase_client()
    res = (
        sb.table("questions")
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = cast(List[Dict[str, Any]], res.data or [])
    return rows


def get_question_versions(question_id: UUID) -> List[Dict[str, Any]]:
    sb = get_supabase_client()
    res = (
        sb.table("question_versions")
        .select("*")
        .eq("question_id", str(question_id))
        .order("version", desc=True)
        .execute()
    )
    rows = cast(List[Dict[str, Any]], res.data or [])
    return rows
