from app.db.client import get_supabase_client, get_supabase_storage_client


def upload_pdf_bytes(
    *,
    bucket: str,
    path: str,
    content: bytes,
    content_type: str = "application/pdf",
) -> str:
    sb = get_supabase_storage_client()
    response = sb.storage.from_(bucket).upload(
        path=path,
        file=content,
        file_options={
            "content-type": content_type,
        },
    )
    print(response)

    return f"{bucket}/{path}"
