from typing import List
from openai.types.chat import ChatCompletionMessageParam

from app.schemas.similar import Difficulty


def build_similar_prompt(
    instruction: str, count: int, difficulty: Difficulty, data_url: str
) -> List[ChatCompletionMessageParam]:

    system = f"""
        You are an educational content generator for teachers.
        CRITICAL OUTPUT RULES:
        - Output MUST be valid JSON only. No markdown. No code fences. No commentary.
        - Output MUST conform to the required JSON shape exactly.
        - You will be given an IMAGE of a question
        - Generate similar questions by cloning the style, topic, and logic.
        - Every question MUST include a detailed step-by-step explanation/solution.
        - Target difficulty: {difficulty}

        QUALITY RULES:
        - Avoid references to “the text says…”; write naturally.
        - Questions must match the requested difficulty.
        - Ensure the correct answer is actually correct based on the STUDY TEXT.
        - Explanations must justify why the answer is correct (and for MCQ, why distractors are wrong).
    """.strip()

    user = f"""
        TASK:
        Generate exactly {count} questions.
        Use the image as the source question.
        Use this instruction {instruction}

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

    """.strip()

    return [
        {"role": "system", "content": system},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": user},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]
