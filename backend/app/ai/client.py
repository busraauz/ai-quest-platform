from openai.types.chat import ChatCompletionMessageParam
from typing import List
from openai import OpenAI
from app.core.config import settings


def get_ai_client() -> OpenAI:
    if not settings.OPENROUTER_BASE_URL or not settings.OPENROUTER_API_KEY:
        raise RuntimeError("OPENROUTER_BASE_URL and OPENROUTER_API_KEY must be set.")
    return OpenAI(
        base_url=settings.OPENROUTER_BASE_URL,
        api_key=settings.OPENROUTER_API_KEY,
    )


def create_embeddings(input: List[str] | str) -> List[List[float]]:
    model = settings.EMBEDDING_MODEL
    if not model:
        raise RuntimeError("EMBEDDING_MODEL must be set.")

    client = get_ai_client()
    resp = client.embeddings.create(
        model=model,
        input=input,
        encoding_format="float",
    )
    return [item.embedding for item in resp.data]


def chat_completion(
    messages: List[ChatCompletionMessageParam], temperature: float = 0.2
) -> str:
    model = settings.QUEST_MODEL
    if not model:
        raise RuntimeError("CHAT_MODEL must be set.")

    client = get_ai_client()
    resp = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return resp.choices[0].message.content or ""
