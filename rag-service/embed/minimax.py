import os
import httpx

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
MINIMAX_API_BASE = os.getenv("MINIMAX_API_BASE", "https://api.minimax.chat")
EMBED_MODEL = "embo"
EMBED_DIM = 384


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 50) -> list[str]:
    if not text.strip():
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:min(end, len(text))]
        if chunk.strip():
            chunks.append(chunk.strip())
        start = end - overlap
        if start >= len(text):
            break
    return chunks


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{MINIMAX_API_BASE}/v1/text/embeddings",
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": EMBED_MODEL,
                "input": texts
            }
        )
        response.raise_for_status()
        data = response.json()
        return [item["embedding"] for item in data["data"]]


async def embed_text(text: str) -> list[float]:
    vectors = await embed_texts([text])
    return vectors[0]