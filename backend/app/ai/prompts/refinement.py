from typing import Dict, List, Any

from app.schemas.document import QuestionType
from openai.types.chat import ChatCompletionMessageParam


def build_refinement_prompt(
    instruction: str,
    current_question: Dict[str, Any],
) -> List[ChatCompletionMessageParam]:
    system = (
        "You are a Canvas Editor.\n"
        "You edit an EXISTING educational question based on a teacher's instruction.\n"
        "You MUST return ONLY valid JSON (no markdown, no commentary).\n"
        "You MUST preserve correctness and internal consistency.\n"
        "Never add extra keys outside the required JSON shape.\n"
    )

    user = f"""
INSTRUCTION:
{instruction}

CURRENT QUESTION (the only source of truth, JSON):
{current_question}

TASK:
Apply the instruction to produce an updated question.

OUTPUT FORMAT (STRICT JSON ONLY):
{{
  "question": {{
    "question_type": "mcq" | "open",
    "question_text": "string",
    "options": {{"A":"string","B":"string","C":"string","D":"string"}} OR null,
    "correct_answer": "A"|"B"|"C"|"D" (if mcq) OR "string" (if open),
    "explanation": "string",
    "tags": null,
    "confidence_score": null
  }}
}}

RULES:
- Do NOT return markdown. Do NOT wrap JSON in code fences.
- Do NOT add any keys other than: question_type, question_text, options, correct_answer, explanation, tags, confidence_score.
- Keep question_type the same unless the instruction explicitly requests a change.
- If question_type == "mcq":
  - options MUST be an object with exactly A, B, C, D.
  - correct_answer MUST be one of A/B/C/D and MUST match the updated options.
- If question_type == "open":
  - options MUST be null.
  - correct_answer MUST be a short text answer.
- The explanation MUST be updated to match the edited question and justify why the correct answer is correct.
- Keep the topic and difficulty roughly consistent unless instruction asks otherwise.
""".strip()

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
