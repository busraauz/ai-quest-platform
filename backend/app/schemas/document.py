from typing import Any, Literal, Optional, Dict, List
from uuid import UUID
from datetime import datetime
from fastapi import Form
from pydantic import BaseModel, Field

QuestionType = Literal["mcq", "open"]


class DocumentGenerateRequest(BaseModel):
    quantity: int = Field(default=10, ge=1, le=50)
    question_type: QuestionType = Field(default="mcq")

    @classmethod
    def as_form(
        cls,
        quantity: int = Form(10),
        question_type: QuestionType = Form("mcq"),
    ) -> "DocumentGenerateRequest":
        return cls(
            quantity=quantity,
            question_type=question_type,
        )


class DocumentServiceResult(BaseModel):
    session_id: UUID
    document_id: UUID
    storage_path: str
    extracted_text_preview: str
    retrieved_context_chunks: List[str] = Field(default_factory=list)


class GeneratedQuestion(BaseModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    document_id: Optional[UUID] = None

    source_type: Literal["document", "similarity"]
    question_type: QuestionType

    question_text: str
    options: Optional[Dict[str, str]] = None
    correct_answer: str
    explanation: str

    tags: Optional[Dict[str, Any]] = None
    confidence_score: Optional[float] = None

    created_at: datetime


class DocumentGenerateResponse(BaseModel):
    session_id: UUID
    document_id: UUID
    questions: List[GeneratedQuestion]


MCQ_OPTIONS_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["A", "B", "C", "D"],
    "properties": {
        "A": {"type": "string", "minLength": 1},
        "B": {"type": "string", "minLength": 1},
        "C": {"type": "string", "minLength": 1},
        "D": {"type": "string", "minLength": 1},
    },
}

QUESTION_GENERATION_SCHEMA = {
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
                            },
                        },
                    },
                    {
                        "if": {"properties": {"question_type": {"const": "open"}}},
                        "then": {
                            "properties": {
                                "options": {"type": "null"},
                                "correct_answer": {"type": "string", "minLength": 1},
                            },
                        },
                    },
                ],
            },
        }
    },
}
