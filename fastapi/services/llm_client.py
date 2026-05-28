"""
LLM 호출 — Gemini 우선, Anthropic 폴백, 둘 다 없으면 규칙 기반 폴백.
API 키는 환경변수로만 사용.
"""
import os
from typing import List, Optional

from services.matey_chat import fallback_reply_without_llm


def get_gemini_api_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY") or None


def get_anthropic_api_key() -> Optional[str]:
    return os.environ.get("ANTHROPIC_API_KEY") or None


def run_chat_completion(
    messages: List[dict],
    *,
    model: str = "gemini-2.0-flash",
    max_tokens: int = 1024,
    mate_key: Optional[str] = None,
    speech_level: Optional[str] = None,
) -> str:
    """
    멀티턴 메시지 → 단일 어시스턴트 응답 문자열.
    system 메시지는 각 LLM API의 system 필드로 분리된다.
    우선순위: Gemini → Anthropic → 규칙 기반 폴백.
    """
    gemini_key = get_gemini_api_key()
    if gemini_key:
        return _run_gemini(messages, model=model, max_tokens=max_tokens, api_key=gemini_key)

    anthropic_key = get_anthropic_api_key()
    if anthropic_key:
        return _run_anthropic(messages, model="claude-3-5-sonnet-20240620", max_tokens=max_tokens, api_key=anthropic_key)

    return fallback_reply_without_llm(messages, mate_key=mate_key, speech_level=speech_level)


def _run_gemini(messages: List[dict], *, model: str, max_tokens: int, api_key: str) -> str:
    from google import genai
    from google.genai import types

    system_parts = [m["content"] for m in messages if m.get("role") == "system"]
    system = "\n".join(system_parts) if system_parts else None

    # system 제외한 마지막 user 메시지를 prompt로, 나머지를 history로
    non_system = [m for m in messages if m.get("role") != "system"]
    if not non_system:
        return ""

    *history_raw, last = non_system
    user_text = last.get("content", "")

    history = []
    for m in history_raw:
        role = "user" if m.get("role") == "user" else "model"
        history.append(types.Content(role=role, parts=[types.Part(text=m.get("content", ""))]))

    client = genai.Client(api_key=api_key)
    cfg = types.GenerateContentConfig(max_output_tokens=max_tokens)
    if system:
        cfg = types.GenerateContentConfig(system_instruction=system, max_output_tokens=max_tokens)

    session = client.chats.create(model=model, config=cfg, history=history)
    response = session.send_message(user_text)
    return response.text or ""


def _run_anthropic(messages: List[dict], *, model: str, max_tokens: int, api_key: str) -> str:
    from anthropic import Anthropic

    system_parts = [m["content"] for m in messages if m.get("role") == "system"]
    system = "\n".join(system_parts) if system_parts else None
    api_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in messages
        if m.get("role") in ("user", "assistant")
    ]
    kwargs = {"model": model, "max_tokens": max_tokens, "messages": api_messages}
    if system:
        kwargs["system"] = system

    client = Anthropic(api_key=api_key)
    msg = client.messages.create(**kwargs)
    if not msg.content:
        return ""
    block = msg.content[0]
    return getattr(block, "text", str(block))
