from typing import List
import fitz  # PyMuPDF


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    parts: List[str] = []
    for page in doc:
        parts.append(str(page.get_text("text") or ""))
    return "\n".join(parts).strip()


def chunk_text(text: str, chunk_size: int = 3500, overlap: int = 400) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []

    chunks: List[str] = []
    start = 0
    n = len(text)

    while start < n:
        end = min(start + chunk_size, n)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        start = max(0, end - overlap)

    return chunks
