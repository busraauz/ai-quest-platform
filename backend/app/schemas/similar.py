from uuid import UUID
from pydantic import BaseModel, Field
from typing import List, Literal
from fastapi import Form

from app.schemas.document import MCQ_OPTIONS_SCHEMA, GeneratedQuestion

Difficulty = Literal["easy", "medium", "hard"]


class SimilarGenerateRequest(BaseModel):
    instruction: str = Field(min_length=3, max_length=2000)
    quantity: int = Field(ge=1, le=20)
    difficulty: Difficulty = "easy"

    @classmethod
    def as_form(
        cls,
        instruction: str = Form(""),
        quantity: int = Form(10),
        difficulty: Difficulty = Form("easy"),
    ) -> "SimilarGenerateRequest":
        return cls(instruction=instruction, quantity=quantity, difficulty=difficulty)


class SimilarServiceResult(BaseModel):
    session_id: UUID
    seed_id: UUID
    storage_path: str
    data_url: str


class SimilarGenerateResponse(BaseModel):
    session_id: UUID
    questions: List[GeneratedQuestion]


SIMILAR_DIRECT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["questions"],
    "properties": {
        "questions": {
            "type": "array",
            "minItems": 1,
            "items": {
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
                    "options": {"oneOf": [MCQ_OPTIONS_SCHEMA, {"type": "null"}]},
                    "correct_answer": {"type": "string", "minLength": 1},
                    "explanation": {"type": "string", "minLength": 30},
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
            },
        }
    },
}
