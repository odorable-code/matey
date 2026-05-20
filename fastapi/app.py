from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, analysis, letter

app = FastAPI(title="Matey AI Server", description="RAG 챗봇 및 AI 분석 API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 운영 환경에서는 허용할 도메인을 명시하세요.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(chat.router)
app.include_router(analysis.router)
app.include_router(letter.router)

@app.get("/")
def read_root():
    return {"message": "Matey AI Server is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
