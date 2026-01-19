from typing import Any, Dict, List, Optional
from uuid import UUID

from app.ai.client import chat_completion
from app.ai.prompts.refinement import build_refinement_prompt
from app.schemas.refinement import QUESTION_REFINEMENT_SCHEMA
from app.utils.json import parse_json_strict, validate_or_raise


class RefinementAgent:
    def run(
        self,
        *,
        instruction: str,
        current_question: Dict[str, Any],
        max_retries: int = 2,
    ) -> Dict[str, Any]:
        messages = build_refinement_prompt(
            instruction=instruction,
            current_question=current_question,
        )

        last_error: Optional[str] = None

        for _ in range(max_retries + 1):
            raw = chat_completion(messages, temperature=0.2)

            try:
                data = parse_json_strict(raw)
                validate_or_raise(data, QUESTION_REFINEMENT_SCHEMA)
                return data["question"]
            except Exception as e:
                last_error = str(e)
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            "Your output is invalid. Fix it.\n"
                            f"Error: {last_error}\n"
                            "Return ONLY JSON exactly matching the required schema."
                        ),
                    }
                )

        raise RuntimeError(f"Refinement failed after retries. Last error: {last_error}")
