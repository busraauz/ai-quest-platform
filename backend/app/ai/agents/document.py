from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.ai.client import chat_completion
from app.ai.prompts.document import build_document_prompt
from app.schemas.document import QUESTION_GENERATION_SCHEMA, QuestionType
from app.utils.json import parse_json_strict, validate_or_raise


class DocumentAgent:
    def run(
        self,
        *,
        context_chunks: List[str],
        count: int,
        question_type: QuestionType,
        max_retries: int = 2,
    ) -> List[Dict[str, Any]]:
        messages = build_document_prompt(
            context_chunks=context_chunks,
            count=count,
            question_type=question_type,
        )

        last_error: Optional[str] = None

        for _ in range(max_retries + 1):
            raw = chat_completion(messages, temperature=0.2)

            try:
                data = parse_json_strict(raw)
                validate_or_raise(data, QUESTION_GENERATION_SCHEMA)
                return data["questions"]
            except Exception as e:
                last_error = str(e)
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            "Your output was invalid JSON or did not match the required schema.\n"
                            f"Error: {last_error}\n"
                            "Return ONLY corrected JSON that matches the shape exactly."
                        ),
                    }
                )

        raise RuntimeError(
            f"DocumentAgent failed after retries. Last error: {last_error}"
        )
