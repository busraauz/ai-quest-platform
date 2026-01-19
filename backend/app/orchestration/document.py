from uuid import UUID
from app.ai.agents.document import DocumentAgent
from app.db.repositories.question import insert_questions
from app.schemas.document import (
    DocumentGenerateRequest,
    DocumentGenerateResponse,
    GeneratedQuestion,
)
from app.services.document import DocumentService


class DocumentOrchestration:
    def __init__(self):
        self.document_service = DocumentService()
        self.agent = DocumentAgent()

    def run(
        self,
        user_id: UUID,
        filename: str,
        pdf_bytes: bytes,
        req: DocumentGenerateRequest,
    ):
        ctx = self.document_service.build_context_from_pdf(
            user_id=user_id, filename=filename, pdf_bytes=pdf_bytes, req=req
        )

        generated_questions = self.agent.run(
            context_chunks=ctx.retrieved_context_chunks,
            count=req.quantity,
            question_type=req.question_type,
        )

        rows = insert_questions(
            user_id=user_id,
            session_id=ctx.session_id,
            document_id=ctx.document_id,
            questions=generated_questions,
        )

        return DocumentGenerateResponse(
            session_id=ctx.session_id,
            document_id=ctx.document_id,
            questions=[GeneratedQuestion(**r) for r in rows],
        )
