"""
감정/대화 분석 등 AI 연동용 엔드포인트.
프론트 reportApi.js 의 ANALYSIS_API_BASE(/api/analysis) 와 맞춤.
"""
from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api", tags=["analysis"])


class AnalysisRequest(BaseModel):
    bot_type: Optional[str] = Field(None, description="봇/메이트 식별자")
    period_days: Optional[int] = Field(None, description="집계 기간(일)")


@router.post("/analysis")
def post_analysis(body: AnalysisRequest) -> Dict[str, Any]:
    """
    TODO: Spring 백엔드 또는 LLM과 연동해 실제 분석 결과를 반환하세요.
    현재는 계약 확인용 스텁입니다.
    """
    return {
        "success": True,
        "message": "AI 서버(fastapi) 스텁 응답입니다. services/ 에 분석 로직을 연결하세요.",
        "data": {
            "bot_type": body.bot_type,
            "period_days": body.period_days,
            "summary": None,
        },
    }


@router.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "matey-fastapi"}
