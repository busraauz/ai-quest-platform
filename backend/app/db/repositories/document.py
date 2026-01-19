from uuid import UUID
from typing import Optional

from supabase import Client

from app.db.client import get_supabase_client
from app.models.document import Document


def create_document(
    user_id: UUID,
    session_id: UUID,
    filename: str,
    storage_path: str,
    mime_type: str = "application/pdf",
    status: str = "uploaded",
    supabase: Client | None = None,
) -> Document:
    sb = supabase or get_supabase_client()
    payload = {
        "user_id": str(user_id),
        "session_id": str(session_id),
        "filename": filename,
        "storage_path": storage_path,
        "mime_type": mime_type,
        "status": status,
    }
    res = sb.table("documents").insert(payload).execute()
    if not res.data:
        raise RuntimeError(f"Failed to create document: {res}")
    return Document.model_validate(res.data[0])


def update_extracted_text(
    user_id: UUID,
    document_id: UUID,
    extracted_text: str,
    supabase: Client | None = None,
) -> Document:
    sb = supabase or get_supabase_client()
    res = (
        sb.table("documents")
        .update({"extracted_text": extracted_text})
        .eq("id", str(document_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not res.data:
        raise RuntimeError(
            f"Failed to update extracted_text for document {document_id}"
        )
    return Document.model_validate(res.data[0])


def update_document_status(
    user_id: UUID,
    document_id: UUID,
    status: str,
    error_message: Optional[str] = None,
    supabase: Client | None = None,
) -> Document:
    sb = supabase or get_supabase_client()
    payload = {"status": status, "error_message": error_message}
    res = (
        sb.table("documents")
        .update(payload)
        .eq("id", str(document_id))
        .eq("user_id", str(user_id))
        .execute()
    )
    if not res.data:
        raise RuntimeError(f"Failed to update status for document {document_id}")
    return Document.model_validate(res.data[0])
