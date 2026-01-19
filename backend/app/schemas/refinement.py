from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from supabase_auth import Dict

from app.schemas.document import (
    MCQ_OPTIONS_SCHEMA,
    QuestionType,
)


class RefinementRequest(BaseModel):
    instruction: str = Field(..., min_length=2, max_length=500)


class QuestionContent(BaseModel):
    question_type: QuestionType
    question_text: str
    options: Optional[Dict[str, str]] = None
    correct_answer: str
    explanation: str
    tags: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None


class RefinementResponse(BaseModel):
    question_id: UUID
    version: int
    question: QuestionContent


QUESTION_REFINEMENT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["question"],
    "properties": {
        "question": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "question_type",
                "question_text",
                "options",
                "correct_answer",
                "explanation",
                "tags",
                "confidence_score",
            ],
            "properties": {
                "question_type": {"type": "string", "enum": ["mcq", "open"]},
                "question_text": {"type": "string", "minLength": 5},
                # MCQ -> object with A/B/C/D
                # Open -> null
                "options": {"oneOf": [MCQ_OPTIONS_SCHEMA, {"type": "null"}]},
                # MCQ -> "A"|"B"|"C"|"D"
                # Open -> free text
                "correct_answer": {"type": "string", "minLength": 1},
                "explanation": {"type": "string", "minLength": 20},
                "tags": {"type": ["object", "null"]},
                "confidence_score": {
                    "type": ["number", "null"],
                    "minimum": 0,
                    "maximum": 1,
                },
            },
            "allOf": [
                {
                    "if": {"properties": {"question_type": {"const": "mcq"}}},
                    "then": {
                        "properties": {
                            "options": MCQ_OPTIONS_SCHEMA,
                            "correct_answer": {"enum": ["A", "B", "C", "D"]},
                        }
                    },
                },
                {
                    "if": {"properties": {"question_type": {"const": "open"}}},
                    "then": {"properties": {"options": {"type": "null"}}},
                },
            ],
        }
    },
}
