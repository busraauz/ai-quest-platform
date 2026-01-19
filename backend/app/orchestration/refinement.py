from uuid import UUID

from fastapi import HTTPException
from app.ai.agents.refinement import RefinementAgent
from app.db.repositories.question import (
    get_latest_question_version,
    get_question_by_id,
    insert_question_version,
    insert_questions,
)
from app.schemas.document import (
    DocumentGenerateRequest,
    DocumentGenerateResponse,
    GeneratedQuestion,
)
from app.schemas.refinement import QuestionContent, RefinementResponse


class RefinementOrchestration:
    def __init__(self):
        self.agent = RefinementAgent()

    def run(self, user_id: UUID, question_id: UUID, instruction: str):
        base = get_question_by_id(question_id)
        if not base:
            raise HTTPException(status_code=404, detail="Question not found")
        if str(base["user_id"]) != str(user_id):
            raise HTTPException(status_code=403, detail="Forbidden")

        base_content = {
            "question_type": base["question_type"],
            "question_text": base["question_text"],
            "options": base.get("options"),
            "correct_answer": base["correct_answer"],
            "explanation": base["explanation"],
            "tags": base.get("tags"),
            "confidence_score": base.get("confidence_score"),
        }

        # 2) Load latest version (latest_content)
        latest = get_latest_question_version(question_id)

        # 3) Seed v1 if none exists (optional but recommended)
        if latest is None:
            insert_question_version(
                question_id=question_id,
                user_id=user_id,
                version=1,
                instruction="__seed__",
                content=base_content,
            )
            current = base_content
            next_version = 2
        else:
            current = latest["content"]
            next_version = int(latest["version"]) + 1

        # ✅ 4) Call agent with latest_content (current)
        edited = self.agent.run(
            instruction=instruction,
            current_question=current,
        )

        # 5) Persist as a NEW version row (don’t update questions)
        insert_question_version(
            question_id=question_id,
            user_id=user_id,
            version=next_version,
            instruction=instruction,
            content=edited,
        )
        content = QuestionContent.model_validate(edited)
        return RefinementResponse(
            question_id=question_id, version=next_version, question=content
        )
