from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from embed.minimax import embed_text
from qdrant.client import search_chunks

router = APIRouter(prefix="/retrieve", tags=["retrieve"])


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5
    filter_source: str | None = None


class RetrieveResponse(BaseModel):
    chunks: list[dict]
    query: str


@router.post("", response_model=RetrieveResponse)
async def retrieve(
    req: RetrieveRequest,
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query cannot be empty")

    vector = await embed_text(req.query)
    chunks = search_chunks(
        tenant_id=x_tenant_id,
        query_vector=vector,
        top_k=req.top_k,
        filter_source=req.filter_source,
    )

    return RetrieveResponse(chunks=chunks, query=req.query)