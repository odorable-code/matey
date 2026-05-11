"""
채팅 봇 응답용 API (프론트 ChatModal 등에서 호출 가능).
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.llm_client import run_chat_completion
from services.matey_chat import build_system_prompt

router = APIRouter(prefix="/api", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    max_tokens: int = Field(default=1024, ge=1, le=8192)
    mate_key: Optional[str] = None
    mate_name: Optional[str] = None
    mate_role: Optional[str] = None
    mate_persona: Optional[str] = None
    # polite: 친구 같은 존댓말 / casual: 반말 (응답 생성 시 system에만 반영)
    speech_level: str = Field(default="polite", description="polite | casual")


@router.post("/chat/completions")
def chat_completions(body: ChatCompletionRequest) -> Dict[str, Any]:
    system = build_system_prompt(
        mate_key=body.mate_key,
        mate_name=body.mate_name,
        mate_role=body.mate_role,
        mate_persona=body.mate_persona,
        speech_level=body.speech_level,
    )
    # 클라이언트가 system을 넣었으면 앞에 병합하지 않고, 없을 때만 주입
    raw = [m.model_dump() for m in body.messages]
    has_system = any(m.get("role") == "system" for m in raw)
    msgs: List[Dict[str, Any]] = (
        [{"role": "system", "content": system}, *raw]
        if not has_system
        else raw
    )
    text = run_chat_completion(
        msgs,
        model=body.model or "claude-3-5-sonnet-20240620",
        max_tokens=body.max_tokens or 1024,
        mate_key=body.mate_key,
        speech_level=body.speech_level,
    )
    return {"reply": text}
