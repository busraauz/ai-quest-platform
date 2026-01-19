from uuid import UUID
from typing import Any, Dict, List, Tuple, cast

from supabase import Client

from app.db.client import get_supabase_client
from app.models.chunks import DocChunk


def insert_chunks(
    user_id: UUID,
    session_id: UUID,
    document_id: UUID,
    chunks: List[str],
    supabase: Client | None = None,
) -> List[DocChunk]:
    """
    Inserts chunks with chunk_index and content.
    Returns inserted rows (including ids).
    """
    sb = supabase or get_supabase_client()
    rows = []
    for i, content in enumerate(chunks):
        rows.append(
            {
                "user_id": str(user_id),
                "session_id": str(session_id),
                "document_id": str(document_id),
                "chunk_index": i,
                "content": content,
            }
        )

    # Supabase PostgREST insert accepts list for bulk insert
    res = sb.table("doc_chunks").insert(rows).execute()
    if not res.data:
        raise RuntimeError(f"Failed to insert doc_chunks: {res}")
    return [DocChunk.model_validate(row) for row in res.data]


def update_embeddings(
    user_id: UUID,
    chunk_id_to_embedding: List[Tuple[UUID, List[float]]],
    supabase: Client | None = None,
) -> int:
    """
    Updates each chunk row with its embedding vector.
    Returns count updated.

    NOTE: We update row-by-row because PostgREST bulk update by differing values
    isn't great. This is fine for assignment scale (a few dozen chunks).
    """
    sb = supabase or get_supabase_client()
    updated = 0

    for chunk_id, embedding in chunk_id_to_embedding:
        # embedding should be a list[float] matching vector dimension
        res = (
            sb.table("doc_chunks")
            .update({"embedding": embedding})
            .eq("id", str(chunk_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        if res.data:
            updated += 1

    return updated


def match_doc_chunks(
    user_id: UUID,
    document_id: UUID,
    query_embedding: List[float],
    match_count: int = 6,
    supabase: Client | None = None,
) -> List[Dict[str, Any]]:
    """
    Calls the SQL RPC function match_doc_chunks defined in document.sql.
    Returns rows with {id, content, chunk_index, similarity}
    """
    sb = supabase or get_supabase_client()
    payload = {
        "p_user_id": str(user_id),
        "p_document_id": str(document_id),
        "p_query_embedding": query_embedding,
        "p_match_count": match_count,
    }
    res = sb.rpc("match_doc_chunks", payload).execute()
    # If no matches, data could be [] which is valid
    return cast(List[Dict[str, Any]], res.data or [])
