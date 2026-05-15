import os
from typing import Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
COLLECTION_PREFIX = "rag"


def _collection_name(tenant_id: str) -> str:
    return f"{COLLECTION_PREFIX}-{tenant_id}"


def _get_client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)


def ensure_collection(tenant_id: str, dim: int = 384) -> None:
    client = _get_client()
    name = _collection_name(tenant_id)
    collections = [c.name for c in client.get_collections().collections]
    if name not in collections:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=dim, distance=Distance.DOT),
        )


def upsert_chunk(
    tenant_id: str,
    chunk_id: str,
    vector: list[float],
    payload: dict,
) -> None:
    client = _get_client()
    name = _collection_name(tenant_id)
    ensure_collection(tenant_id, len(vector))
    client.upsert(
        collection_name=name,
        points=[
            PointStruct(
                id=chunk_id,
                vector=vector,
                payload=payload,
            )
        ],
    )


def search_chunks(
    tenant_id: str,
    query_vector: list[float],
    top_k: int = 5,
    filter_source: Optional[str] = None,
) -> list[dict]:
    client = _get_client()
    name = _collection_name(tenant_id)

    search_filter = None
    if filter_source:
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="source",
                    match=MatchValue(value=filter_source),
                )
            ]
        )

    results = client.search(
        collection_name=name,
        query_vector=query_vector,
        limit=top_k,
        query_filter=search_filter,
    )

    return [
        {
            "id": hit.id,
            "score": hit.score,
            "chunk_text": hit.payload.get("chunk_text", ""),
            "source": hit.payload.get("source", ""),
            "chunk_index": hit.payload.get("chunk_index", 0),
        }
        for hit in results
    ]