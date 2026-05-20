from typing import Generator
from google import genai
from google.genai import types

from config import config
from vector_store import VectorStore

_SYSTEM_PROMPT = """당신은 "멍이"입니다. 따뜻하고 공감 능력이 뛰어난 강아지 AI 친구예요.

캐릭터 특성:
- "멍멍", "왈왈", "멍..." 같은 강아지 표현을 자연스럽게 섞어 말합니다
- 사용자의 감정을 먼저 공감하고 인정해줍니다
- 따뜻하고 긍정적이지만 감정을 억지로 바꾸려 하지 않습니다
- 꼬리 흔들기, 옆에 붙어있기 등 강아지 행동을 자연스럽게 묘사합니다
- 🐾 이모지를 자주 씁니다

규칙:
1. 아래 예시 대화들의 톤과 스타일을 참고해 멍이답게 답변하세요.
2. 사용자의 감정을 판단하거나 가르치지 말고 공감해주세요.
3. 짧고 따뜻한 답변을 선호합니다.
4. 멍이 캐릭터를 절대 벗어나지 마세요.
"""

_RAG_TEMPLATE = """[유사한 대화 예시]
{context}

[사용자 메시지]
{question}

위 예시들을 참고해서 멍이답게 따뜻하게 답변해줘."""


def _build_context(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk["metadata"]
        user_msg = meta.get("user_message", "")
        assistant_msg = meta.get("assistant_message", "")
        category = meta.get("category", "")
        if user_msg and assistant_msg:
            label = f"({category})" if category else ""
            parts.append(f"[예시 {i}] {label}\n사용자: {user_msg}\n멍이: {assistant_msg}")
        else:
            parts.append(f"[참고 {i}]\n{chunk['content']}")
    return "\n\n".join(parts)


class RAGChatbot:
    def __init__(self, store: VectorStore | None = None) -> None:
        config.validate()
        self._genai = genai.Client(api_key=config.GEMINI_API_KEY)
        self._store = store or VectorStore()
        self._history: list[types.Content] = []

    # ------------------------------------------------------------------
    # 단일 응답
    # ------------------------------------------------------------------

    def chat(self, question: str, top_k: int | None = None, system_prompt: str | None = None) -> tuple[str, list[dict]]:
        """질문에 답변하고 (응답 텍스트, 참조 청크 목록)을 반환합니다."""
        chunks = self._store.query(question, top_k=top_k)
        if not chunks:
            return "벡터 DB에 데이터가 없습니다. 먼저 문서를 인덱싱하세요.", []

        context = _build_context(chunks)
        prompt = _RAG_TEMPLATE.format(context=context, question=question)

        session = self._genai.chats.create(
            model=config.CHAT_MODEL,
            config=types.GenerateContentConfig(system_instruction=system_prompt or _SYSTEM_PROMPT),
            history=self._history,
        )
        response = session.send_message(prompt)
        answer = response.text

        self._history.append(types.Content(role="user", parts=[types.Part(text=prompt)]))
        self._history.append(types.Content(role="model", parts=[types.Part(text=answer)]))

        return answer, chunks

    # ------------------------------------------------------------------
    # 스트리밍 응답
    # ------------------------------------------------------------------

    def stream_chat(self, question: str, top_k: int | None = None) -> Generator[str, None, list[dict]]:
        """스트리밍 방식으로 답변을 yield합니다. 마지막에 참조 청크를 반환합니다."""
        chunks = self._store.query(question, top_k=top_k)
        if not chunks:
            yield "벡터 DB에 데이터가 없습니다. 먼저 문서를 인덱싱하세요."
            return

        context = _build_context(chunks)
        prompt = _RAG_TEMPLATE.format(context=context, question=question)

        session = self._genai.chats.create(
            model=config.CHAT_MODEL,
            config=types.GenerateContentConfig(system_instruction=_SYSTEM_PROMPT),
            history=self._history,
        )

        full_answer = []
        for chunk in session.send_message_stream(prompt):
            text = chunk.text
            full_answer.append(text)
            yield text

        answer = "".join(full_answer)
        self._history.append(types.Content(role="user", parts=[types.Part(text=prompt)]))
        self._history.append(types.Content(role="model", parts=[types.Part(text=answer)]))

    def clear_history(self) -> None:
        self._history = []
