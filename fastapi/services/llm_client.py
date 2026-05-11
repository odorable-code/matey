"""
LLM(Claude 등) 호출 — API 키는 환경변수로만 사용.
파인튜닝/학습 데이터: fastapi/scripts/ 및 data/*.jsonl 참고.
"""
import os
from typing import List, Optional

from services.matey_chat import fallback_reply_without_llm


def get_anthropic_api_key() -> Optional[str]:
    return os.environ.get("ANTHROPIC_API_KEY") or None


def run_chat_completion(
    messages: List[dict],
    *,
    model: str = "claude-3-5-sonnet-20240620",
    max_tokens: int = 1024,
    mate_key: Optional[str] = None,
    speech_level: Optional[str] = None,
) -> str:
    """
    멀티턴 메시지 → 단일 어시스턴트 응답 문자열.
    system 메시지는 Anthropic API의 system 필드로 분리된다.
    키/패키지 없으면 matey_chat 규칙 기반 폴백.
    """
    api_key = get_anthropic_api_key()
    if not api_key:
        return fallback_reply_without_llm(
            messages, mate_key=mate_key, speech_level=speech_level
        )

    try:
        from anthropic import Anthropic
    except ImportError:
        return fallback_reply_without_llm(
            messages, mate_key=mate_key, speech_level=speech_level
        )

    client = Anthropic(api_key=api_key)
    # Anthropic API: system 은 별도 필드
    system_parts = [m["content"] for m in messages if m.get("role") == "system"]
    system = "\n".join(system_parts) if system_parts else None
    api_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m.get("role") in ("user", "assistant")
    ]
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "messages": api_messages,
    }
    if system:
        kwargs["system"] = system
    msg = client.messages.create(**kwargs)
    if not msg.content:
        return ""
    block = msg.content[0]
    return getattr(block, "text", str(block))
