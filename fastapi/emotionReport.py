from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from datetime import datetime, date, timedelta

class DailySummary:
    # SQLAlchemy 모델 정의 내용...
    pass

class ChatLog:
    # SQLAlchemy 모델 정의 내용...
    pass

# 2. 유틸리티 함수 (함수가 정의되어 있어야 함)
def analyze_logs(logs):
    # 로그 분석 로직
    return "오늘의 분석 결과"

def generate_bot_report(data, bot_name):
    # 동물 말투 변환 로직
    return {"report": f"{bot_name} 스타일의 리포트 완료!"}

# 3. DB 세션 관리 함수 (보통 database.py에 정의)
def get_db():
    db = SessionLocal() # 세션 생성 로직 필요
    try:
        yield db
    finally:
        db.close()

@app.get("/api/report")
async def get_combined_report(period: str, bot: str, user_id: str, db: Session = Depends(get_db)):
    # 1. 날짜 설정
    days_back = int(period.replace('d', ''))
    today = date.today()
    start_date = today - timedelta(days=days_back)
    yesterday = today - timedelta(days=1)

    # 2. 과거 데이터 가져오기 (미리 가공된 데이터 - 어제까지)
    # DailySummary 테이블에서 start_date ~ yesterday 사이의 데이터를 조회
    past_summaries = db.query(DailySummary).filter(
        DailySummary.user_id == user_id,
        DailySummary.bot_name == bot,
        DailySummary.target_date >= start_date,
        DailySummary.target_date <= yesterday
    ).all()

    # 3. 오늘 데이터 가져오기 (실시간 원본 로그 - 오늘 00:00 이후)
    today_logs = db.query(ChatLog).filter(
        ChatLog.user_id == user_id,
        ChatLog.bot_name == bot,
        ChatLog.created_at >= datetime.combine(today, datetime.min.time())
    ).all()

    # 4. 데이터 합치기 (Merging Logic)
    # past_summaries의 결과와 today_logs를 분석한 결과를 하나로 합칩니다.
    combined_data = {
        "summary_list": [s.content for s in past_summaries],
        "today_content": analyze_logs(today_logs), # 오늘치 로그를 즉석에서 간단히 분석
        "total_count": len(past_summaries) + (1 if today_logs else 0)
    }

    # 5. 최종 리포트 가공 (동물 말투 입히기)
    final_report = generate_bot_report(combined_data, bot)
    
    return final_report

# DB 모델 및 설정 임포트 (본인의 설정에 맞게 수정)
# from database import get_db, ChatLog 

app = FastAPI()

@app.get("/api/report")
async def get_emotion_report(
    period: str = Query(..., description="7d, 30d, 90d 등"),
    bot: str = Query(..., description="cat, bear, dog, hamster 등"),
    db: Session = Depends(get_db) # DB 세션 주입
):
    # 1. 기간(period) 문자열을 날짜 데이터로 변환
    # '7d'에서 숫자 7만 추출
    days_back = int(period.replace('d', ''))
    start_date = datetime.now() - timedelta(days=days_back)

    # 2. DB에서 데이터 조회
    # - 특정 봇(bot)과의 대화이고
    # - 설정한 시작 날짜(start_date) 이후의 데이터만 필터링
    chat_logs = db.query(ChatLog).filter(
        ChatLog.bot_name == bot,
        ChatLog.created_at >= start_date
    ).order_by(ChatLog.created_at.asc()).all()

    # 3. 조회된 대화 내역 가공 (필요 시)
    # 리액트가 사용하기 편한 리스트 형태로 반환
    formatted_history = [
        {
            "id": log.id,
            "speaker": log.speaker, # 'me' 또는 'bot'
            "message": log.message,
            "emotion": log.emotion,
            "created_at": log.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for log in chat_logs
    ]

    return {
        "bot": bot,
        "period": period,
        "count": len(formatted_history),
        "chat_entries": formatted_history
    }