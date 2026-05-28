"""
채팅 봇 응답용 API (프론트 ChatModal 등에서 호출 가능).
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.llm_client import run_chat_completion
from services.matey_chat import build_system_prompt
from services.emotion_analyzer import analyze as analyze_emotion
from rag_chatbot import RAGChatbot
from vector_store import VectorStore

router = APIRouter(prefix="/api", tags=["chat"])

# RAG 챗봇 인스턴스 초기화 (싱글톤처럼 사용)
store = VectorStore()
bot = RAGChatbot(store=store)

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


class RAGChatRequest(BaseModel):
    question: str
    top_k: Optional[int] = Field(default=5, ge=1, le=20)
    speech_level: str = Field(default="polite", description="polite | casual")
    mate_key: Optional[str] = None
    mate_name: Optional[str] = None
    mate_role: Optional[str] = None
    mate_persona: Optional[str] = None
    history: Optional[List[ChatMessage]] = Field(default_factory=list)


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
        model=body.model or "gemini-2.0-flash",
        max_tokens=body.max_tokens or 1024,
        mate_key=body.mate_key,
        speech_level=body.speech_level,
    )
    return {"reply": text}


@router.post("/chat")
def chat_rag(body: RAGChatRequest) -> Dict[str, Any]:
    """
    RAG 기반 챗봇 엔드포인트.
    ChromaDB에서 유사한 문서를 찾아 답변을 생성합니다.
    """
    system = build_system_prompt(
        mate_key=body.mate_key,
        mate_name=body.mate_name,
        mate_role=body.mate_role,
        mate_persona=body.mate_persona,
        speech_level=body.speech_level,
    )
    emotion = analyze_emotion(body.question)
    history = [m.model_dump() for m in (body.history or [])]
    answer, chunks = bot.chat(body.question, top_k=body.top_k, system_prompt=system, history=history)
    return {
        "reply": answer,
        "emotion": {
            "emotion_code": emotion.emotion_code,
            "valence":      emotion.valence,
            "arousal":      emotion.arousal,
            "by_llm":       emotion.by_llm,
            "confidence":   emotion.confidence,
        },
        "references": [
            {
                "content":  c["content"],
                "metadata": c["metadata"],
                "score":    float(c["score"]) if "score" in c else 0.0,
            } for c in chunks
        ],
    }

