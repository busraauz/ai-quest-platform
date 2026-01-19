from uuid import UUID

from fastapi import UploadFile
from app.ai.agents.similar import SimilarAgent
from app.db.repositories.question import insert_questions
from app.schemas.document import GeneratedQuestion
from app.schemas.similar import SimilarGenerateRequest, SimilarGenerateResponse
from app.services.similar import SimilarService


class SimilarOrchestration:
    def __init__(self):
        self.similar_service = SimilarService()
        self.agent = SimilarAgent()

    def run(
        self,
        user_id: UUID,
        image: UploadFile,
        req: SimilarGenerateRequest,
        img_bytes: bytes,
    ):

        ctx = self.similar_service.build_context_from_similar_question(
            user_id=user_id, image=image, req=req, img_bytes=img_bytes
        )

        generated_questions = self.agent.run(
            instruction=req.instruction,
            difficulty=req.difficulty,
            quantity=req.quantity,
            data_url=ctx.data_url,
        )

        rows = insert_questions(
            user_id=user_id,
            session_id=ctx.session_id,
            source_type="similarity",
            questions=generated_questions,
        )

        return SimilarGenerateResponse(
            session_id=ctx.session_id,
            questions=[GeneratedQuestion(**r) for r in rows],
        )
