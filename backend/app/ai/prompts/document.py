from typing import Dict, List

from app.schemas.document import QuestionType
from openai.types.chat import ChatCompletionMessageParam


def build_document_prompt(
    context_chunks: List[str],
    count: int,
    question_type: QuestionType,
) -> List[ChatCompletionMessageParam]:
    """
    Returns chat messages for document-based question generation.
    Output MUST be strict JSON only (no markdown, no prose).
    """

    system = f"""
You are an educational content generator for teachers.

CRITICAL OUTPUT RULES:
- Output MUST be valid JSON only. No markdown. No code fences. No commentary.
- Output MUST conform to the required JSON shape exactly.
- Do NOT include any keys beyond those specified.
- Every question MUST include a detailed step-by-step explanation/solution.

QUALITY RULES:
- Use ONLY the provided STUDY TEXT as source.
- Avoid references to “the text says…”; write naturally.
- Questions must match the requested difficulty.
- Ensure the correct answer is actually correct based on the STUDY TEXT.
- Explanations must justify why the answer is correct (and for MCQ, why distractors are wrong).
""".strip()

    # Keep context concise; you can join top-k retrieved chunks here
    study_text = "\n\n---\n\n".join(context_chunks)

    user = f"""
TASK:
Generate exactly {count} questions from the STUDY TEXT.

PARAMETERS:
- question_type: {question_type}  (mcq OR open-ended)

OUTPUT JSON SHAPE (STRICT):
{{
  "questions": [
    {{
      "question_type": "mcq" | "open",
      "question_text": "string",

      "options": 
        - if question_type == "mcq": {{"A":"string","B":"string","C":"string","D":"string"}}
        - if question_type == "open": null
    
      "correct_answer": 
        - if question_type == "mcq": one of "A","B","C","D"
        - if question_type == "open": a concise correct response (string)

      "explanation": "string (detailed, step-by-step)",

      "tags": object OR null,
      "confidence_score": number(0..1) OR null
    }}
  ]
}}

ADDITIONAL CONSTRAINTS:
- If question_type is "mcq":
  - options MUST be an object with exactly 4 keys: A, B, C, D
  - correct_answer MUST be exactly one of: "A","B","C","D"
  - Include plausible distractors (wrong choices) based on common misconceptions from the text.
- If question_type is "open":
  - options MUST be null
  - correct_answer MUST be a short text answer (not a paragraph)
- explanation MUST be detailed and step-by-step for BOTH types.

STUDY TEXT:
{study_text}
""".strip()

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
