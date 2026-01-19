from turtle import st
from typing import List
from uuid import UUID
from venv import create

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
from app.db.repositories.session import create_session
from app.core.config import settings
from app.models import document
from app.schemas.document import DocumentGenerateRequest, DocumentServiceResult
from app.utils.pdf import chunk_text, extract_text_from_pdf_bytes
from app.utils.storage import upload_pdf_bytes


class DocumentService:
    def build_context_from_pdf(
        self,
        user_id: UUID,
        filename: str,
        pdf_bytes: bytes,
        req: DocumentGenerateRequest,
    ) -> DocumentServiceResult:
        session = create_session(
            user_id=user_id,
            source_type="document",
            quantity=req.quantity,
            question_type=req.question_type,
        )
        session_id = session.id

        placeholder_storage_path = (
            f"{settings.SUPABASE_STORAGE_DOC_BUCKET}/{user_id}/{session_id}/pending.pdf"
        )
        doc = create_document(
            user_id=user_id,
            session_id=session_id,
            filename=filename,
            storage_path=placeholder_storage_path,
        )
        document_id = doc.id
        final_path = f"{user_id}/{session_id}/{document_id}.pdf"

        storage_path = upload_pdf_bytes(
            bucket=settings.SUPABASE_STORAGE_DOC_BUCKET,
            path=final_path,
            content=pdf_bytes,
        )

        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)
        update_extracted_text(
            user_id=user_id, document_id=document_id, extracted_text=extracted_text
        )

        chunks = chunk_text(
            extracted_text,
            chunk_size=settings.PDF_CHUNK_SIZE,
            overlap=settings.PDF_CHUNK_OVERLAP,
        )

        if not chunks:
            raise ValueError(
                "No text chunks extracted from PDF (empty or scanned PDF without OCR)."
            )

        chunk_rows = insert_chunks(
            user_id=user_id,
            session_id=session_id,
            document_id=document_id,
            chunks=chunks,
        )

        embeddings = embed_texts([c.content for c in chunk_rows])
        id_to_emb = [(row.id, emb) for row, emb in zip(chunk_rows, embeddings)]
        update_embeddings(user_id=user_id, chunk_id_to_embedding=id_to_emb)

        ## TODO  retrieval query
        ## TODO match_count
        retrieval_query = (
            "key concepts, important definitions, main ideas, formulas, examples"
        )

        q_emb = embed_query(retrieval_query)
        matches = match_doc_chunks(
            user_id=user_id,
            document_id=document_id,
            query_embedding=q_emb,
            match_count=6,
        )
        retrieved: List[str] = [m["content"] for m in matches] if matches else []
        update_document_status(
            user_id=user_id, document_id=document_id, status="ready", error_message=None
        )
        return DocumentServiceResult(
            session_id=session_id,
            document_id=document_id,
            storage_path=storage_path,
            extracted_text_preview=extracted_text[:600],
            retrieved_context_chunks=retrieved,
        )
