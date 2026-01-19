from uuid import UUID
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps.auth import get_current_user
from app.orchestration.refinement import RefinementOrchestration
from app.schemas.document import (
    DocumentGenerateRequest,
    DocumentGenerateResponse,
)
from app.schemas.refinement import RefinementRequest, RefinementResponse

router = APIRouter(prefix="/refine", tags=["refinement"])
orchestration = RefinementOrchestration()


@router.post(
    "/{question_id}",
    status_code=status.HTTP_201_CREATED,
    response_model=RefinementResponse,
)
async def generate(
    question_id: UUID,
    req: RefinementRequest,
    user=Depends(get_current_user),
):
    return orchestration.run(
        user_id=user.id, question_id=question_id, instruction=req.instruction
    )
