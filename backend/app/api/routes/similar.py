from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps.auth import get_current_user
from app.orchestration.similar import SimilarOrchestration
from app.schemas.similar import SimilarGenerateRequest

router = APIRouter(prefix="/similar", tags=["similar-question"])
orchestration = SimilarOrchestration()


@router.post(
    "/generate",
    status_code=status.HTTP_201_CREATED,
)
async def similar_question(
    req: SimilarGenerateRequest = Depends(SimilarGenerateRequest.as_form),
    image: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if not req.instruction.strip():
        raise HTTPException(status_code=400, detail="instruction is required")

    img_bytes = await image.read()
    if not img_bytes:
        raise HTTPException(status_code=400, detail="Empty image")

    return orchestration.run(user_id=user.id, image=image, req=req, img_bytes=img_bytes)
