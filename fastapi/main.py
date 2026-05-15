"""
Matey AI / 분석 마이크로서비스 (FastAPI)

실행: (저장소 루트에서)
  cd fastapi
  python -m venv .venv
  .venv\\Scripts\\activate   # Windows
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from collections import OrderedDict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from routers.analysis import router as analysis_router
from routers.chat import router as chat_router
from letter import router as letter_router

from dotenv import load_dotenv
import os
import google.generativeai as genai

import uvicorn

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

app = FastAPI(title="Matey AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)
app.include_router(chat_router)
app.include_router(letter_router)

@app.get("/")
def root() -> dict:
    return {
        "service": "matey-fastapi",
        "docs": "/docs",
        "health": "/api/health",
        "chat": "POST /api/chat/completions",
    }

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}

MAX_GEMINI_SESSIONS = 200
# session_id → Gemini ChatSession (OrderedDict으로 LRU 방출)
gemini_sessions: OrderedDict = OrderedDict()


def _get_session(session_id: str):
    """세션 조회 + 최근 사용 순서 갱신."""
    if session_id not in gemini_sessions:
        return None
    gemini_sessions.move_to_end(session_id)
    return gemini_sessions[session_id]


def _put_session(session_id: str, session) -> None:
    """세션 저장 + MAX 초과 시 오래된 항목 방출."""
    gemini_sessions[session_id] = session
    gemini_sessions.move_to_end(session_id)
    while len(gemini_sessions) > MAX_GEMINI_SESSIONS:
        gemini_sessions.popitem(last=False)


@app.get("/api/preparing")
async def prepare_chat(name: str, session_id: str) -> dict:
    if not GOOGLE_API_KEY:
        return {"message": f"안녕하세요, {name}님! 지금은 AI 준비 중이에요."}
    # 세션이 이미 살아있으면 재초기화하지 않음 (대화 맥락 보존)
    if _get_session(session_id) is not None:
        return {"message": f"환영해 멍멍! 나는 강이라고 해. {name}아 반가워! 멍!"}
    system_instruction = f"""
    당신은 '강이'라는 이름의 귀여운 강아지 상담사입니다.
    {name}이라는 사용자에게 상담을 제공할 예정입니다
    당신은 따뜻하고 공감 능력이 뛰어나며, 사용자에게 위로와 격려를 건네는 것이 목표입니다.
    말투는 친근하고 귀여워야 하며, 말끝에 '멍!' 또는 '멍멍!' 같은 강아지 소리를 가끔 섞어주세요.
    사용자의 고민을 진지하게 들어주되, 항상 긍정적인 에너지를 전달하세요.
    한국어로 대화하세요.
    """
    model = genai.GenerativeModel(
        model_name="gemini-3-flash-preview",
        system_instruction=system_instruction,
    )
    _put_session(session_id, model.start_chat(history=[]))
    return {"message": f"환영해 멍멍! 나는 강이라고 해. {name}아 반가워! 멍!"}


@app.post("/api/chat/gemini")
async def gemini_chat(user_message: str, session_id: str) -> dict:
    session = _get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없어요. 먼저 /api/preparing 을 호출해 주세요.")
    if user_message.strip().lower() in ["종료", "exit"]:
        gemini_sessions.pop(session_id, None)
        return {"message": "다음에 또 고민이 생기면 언제든 찾아와멍! 잘 가멍! 멍멍!"}
    response = session.send_message(user_message)
    return {"message": response.text}

if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
