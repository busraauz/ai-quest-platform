import base64
from turtle import st
from typing import List
from uuid import UUID
from venv import create

from fastapi import HTTPException, UploadFile

from app.ai.embeddings import embed_query, embed_texts
from app.db.repositories.chunks import (
    insert_chunks,
    match_doc_chunks,
    update_embeddings,
)
from app.db.repositories.document import (
    create_document,
    update_document_status,
    update_extracted_text,
)
from app.db.repositories.question_seed import insert_question_seed, update_question_seed
from app.db.repositories.session import create_session
from app.core.config import settings
from app.models import document
from app.schemas.document import DocumentGenerateRequest, DocumentServiceResult
from app.schemas.similar import Difficulty, SimilarGenerateRequest, SimilarServiceResult
from app.utils.pdf import chunk_text, extract_text_from_pdf_bytes
from app.utils.storage import upload_pdf_bytes


class SimilarService:
    def build_context_from_similar_question(
        self, user_id: UUID, image: UploadFile, req: SimilarGenerateRequest, img_bytes
    ):
        session = create_session(
            user_id=user_id,
            source_type="similarity",
            quantity=req.quantity,
            question_type="mcq",
            difficulty="easy",
        )

        session_id = session.id

        placeholder_storage_path = f"{settings.SUPABASE_STORAGE_SIMILAR_BUCKET}/{user_id}/{session_id}/pending.pdf"
        seed_row = insert_question_seed(
            user_id=user_id,
            session_id=session_id,
            seed_text=None,
            seed_image_path=placeholder_storage_path,
        )

        seed_id = seed_row.id
        ext = (image.filename or "seed.png").split(".")[-1].lower()
        final_path = f"{user_id}/{session_id}/{seed_id}.{ext}"

        storage_path = upload_pdf_bytes(
            bucket=settings.SUPABASE_STORAGE_SIMILAR_BUCKET,
            path=final_path,
            content=img_bytes,
            content_type=image.content_type or "image/png",
        )

        update_question_seed(
            seed_id,
            {
                "seed_image_path": storage_path,
                "seed_image_mime": image.content_type or "image/png",
                "seed_image_size": len(img_bytes),
            },
        )
        mime = image.content_type or "image/png"
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        data_url = f"data:{mime};base64,{b64}"
        return SimilarServiceResult(
            session_id=session_id,
            seed_id=seed_id,
            storage_path=storage_path,
            data_url=data_url,
        )
