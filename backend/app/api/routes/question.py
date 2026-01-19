from uuid import UUID
from fastapi import APIRouter, Depends

from app.api.deps.auth import get_current_user
from app.db.repositories.question import (
    get_question_by_id,
    get_question_versions,
    get_questions_by_session,
    get_recent_questions,
)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/recent")
async def get_recent_for_user(user=Depends(get_current_user)):
    return get_recent_questions(str(user.id))


@router.get("/{question_id}")
async def get_question(question_id: str):
    return get_question_by_id(UUID(question_id))


@router.get("/session/{session_id}")
async def get_questions_by_session_id(session_id: str):
    return get_questions_by_session(session_id)


@router.get("/{question_id}/versions")
async def get_versions_for_question(question_id: str):
    return get_question_versions(UUID(question_id))
