"""
Matey AI / 분석 마이크로서비스 (FastAPI)

실행: (저장소 루트에서)
  cd fastapi
  python -m venv .venv
  .venv\\Scripts\\activate   # Windows
  pip install -r requirements.txt
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.analysis import router as analysis_router
from routers.chat import router as chat_router

app = FastAPI(title="Matey AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=["*"] 와 credentials=True 는 브라우저 규격상 함께 쓸 수 없음 → fetch 실패 유발
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)
app.include_router(chat_router)


@app.get("/")
def root() -> dict:
    return {
        "service": "matey-fastapi",
        "docs": "/docs",
        "health": "/api/health",
        "chat": "POST /api/chat/completions",
    }
