from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps.auth import get_current_user
from app.orchestration.document import DocumentOrchestration
from app.schemas.document import (
    DocumentGenerateRequest,
    DocumentGenerateResponse,
)
from app.services.document import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])
document_service = DocumentService()
orchestration = DocumentOrchestration()


@router.post(
    "/generate",
    status_code=status.HTTP_201_CREATED,
    response_model=DocumentGenerateResponse,
)
async def generate(
    file: UploadFile = File(...),
    req: DocumentGenerateRequest = Depends(DocumentGenerateRequest.as_form),
    user=Depends(get_current_user),
):
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    return orchestration.run(
        user_id=user.id,
        filename=file.filename or "document.pdf",
        pdf_bytes=pdf_bytes,
        req=req,
    )
