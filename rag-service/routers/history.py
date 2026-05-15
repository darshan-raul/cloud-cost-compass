import uuid
from datetime import datetime
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/history", tags=["history"])


class ChatMessageCreate(BaseModel):
    session_id: str
    role: str
    content: str


class ChatMessage(BaseModel):
    id: str
    tenant_id: str
    session_id: str
    role: str
    content: str
    created_at: datetime


def _get_db():
    import psycopg2
    import os
    return psycopg2.connect(os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/cccdb"))


@router.get("", response_model=list[ChatMessage])
async def get_history(
    session_id: str,
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    limit: int = 50,
):
    conn = _get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, tenant_id, session_id, role, content, created_at
                FROM chat_messages
                WHERE tenant_id = %s AND session_id = %s
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (x_tenant_id, session_id, limit),
            )
            rows = cur.fetchall()
            return [
                ChatMessage(
                    id=str(r[0]),
                    tenant_id=str(r[1]),
                    session_id=r[2],
                    role=r[3],
                    content=r[4],
                    created_at=r[5],
                )
                for r in rows
            ]
    finally:
        conn.close()


@router.post("", response_model=ChatMessage)
async def post_message(
    msg: ChatMessageCreate,
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
):
    if msg.role not in ("user", "assistant", "system"):
        raise HTTPException(status_code=400, detail="role must be user, assistant, or system")

    msg_id = str(uuid.uuid4())
    conn = _get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (id, tenant_id, session_id, role, content)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING created_at
                """,
                (msg_id, x_tenant_id, msg.session_id, msg.role, msg.content),
            )
            created_at = cur.fetchone()[0]
        conn.commit()
        return ChatMessage(
            id=msg_id,
            tenant_id=x_tenant_id,
            session_id=msg.session_id,
            role=msg.role,
            content=msg.content,
            created_at=created_at,
        )
    finally:
        conn.close()