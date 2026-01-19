from typing import Optional
from app.ai.client import chat_completion
from app.ai.prompts.similar import build_similar_prompt
from app.schemas.similar import SIMILAR_DIRECT_SCHEMA, Difficulty
from app.utils.json import parse_json_strict, validate_or_raise


class SimilarAgent:
    def run(
        self,
        instruction: str,
        difficulty: Difficulty,
        quantity: int,
        data_url: str,
        max_retries: int = 2,
    ):
        messages = build_similar_prompt(
            instruction=instruction,
            difficulty=difficulty,
            count=quantity,
            data_url=data_url,
        )

        last_error: Optional[str] = None

        for _ in range(max_retries + 1):
            raw = chat_completion(messages, temperature=0.2)

            try:
                data = parse_json_strict(raw)
                validate_or_raise(data, SIMILAR_DIRECT_SCHEMA)
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
            f"Similar Agent failed after retries. Last error: {last_error}"
        )
