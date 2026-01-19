from typing import List
from app.ai.client import create_embeddings
from app.core.config import settings


def embed_texts(texts: List[str], batch_size: int = 64) -> List[List[float]]:
    clean = [(t or "").strip() for t in texts]
    if not clean:
        return []

    out: List[List[float]] = []
    for i in range(0, len(clean), batch_size):
        batch = clean[i : i + batch_size]
        out.extend(create_embeddings(batch))

    expected_dim = getattr(settings, "EMBEDDING_DIM", None)
    if expected_dim:
        expected = int(expected_dim)
        for emb in out:
            if len(emb) != expected:
                raise RuntimeError(
                    f"Embedding dimension mismatch. Expected {expected}, got {len(emb)}. "
                    f"Model={settings.EMBEDDING_MODEL}"
                )

    return out


def embed_query(text: str) -> List[float]:
    return embed_texts([text], batch_size=1)[0]
