"""
하이브리드 감정 분석: 사전 방식(VA 점수 합산) → 애매하면 LLM 폴백

V (Valence) : 긍/부정  -1.0 ~ +1.0
A (Arousal) : 각성/활성 -1.0 ~ +1.0

결과 emotion_code 는 EMOTION_CATEGORY 테이블의 emotion_code 와 대응.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Optional

# ── 감정 사전 ─────────────────────────────────────────────────────────────────
# 형식: "키워드(어간/대표형)": (valence, arousal)
# 한 단어에 여러 표층형이 있을 경우 모두 등록
_VA_DICT: dict[str, tuple[float, float]] = {
    # ── 행복 · 설렘 (high V, high A) ──────────────────────────────────────
    "행복":   ( 0.90,  0.65), "행복해":  ( 0.90,  0.65),
    "기뻐":   ( 0.85,  0.60), "기쁘다":  ( 0.85,  0.60), "기쁨":    ( 0.85,  0.60),
    "즐거워": ( 0.80,  0.55), "즐겁다":  ( 0.80,  0.55),
    "신나":   ( 0.80,  0.80), "신난다":  ( 0.80,  0.80), "신남":    ( 0.80,  0.80),
    "설레":   ( 0.75,  0.75), "설렌다":  ( 0.75,  0.75), "설렘":    ( 0.75,  0.75),
    "흥분":   ( 0.70,  0.85), "흥겨워":  ( 0.70,  0.70),
    "웃겨":   ( 0.65,  0.55), "재밌어":  ( 0.70,  0.50), "재미있어":( 0.70,  0.50),
    "좋아":   ( 0.70,  0.40), "좋다":    ( 0.70,  0.40), "좋아해":  ( 0.70,  0.40),
    "최고야": ( 0.85,  0.60), "대박":    ( 0.75,  0.70),
    # ── 평온 · 감사 (high V, low A) ──────────────────────────────────────
    "감사":   ( 0.80,  0.05), "감사해":  ( 0.80,  0.05), "고마워":  ( 0.78,  0.05),
    "고맙다": ( 0.78,  0.05), "다행":    ( 0.70,  0.10),
    "평온":   ( 0.55, -0.30), "평화로워":( 0.55, -0.35),
    "차분":   ( 0.50, -0.40), "차분해":  ( 0.50, -0.40),
    "안정":   ( 0.55, -0.30), "안정적":  ( 0.55, -0.30),
    "편안":   ( 0.60, -0.25), "편안해":  ( 0.60, -0.25),
    "뿌듯":   ( 0.75,  0.20), "뿌듯해":  ( 0.75,  0.20),
    "만족":   ( 0.70,  0.00), "만족해":  ( 0.70,  0.00),
    # ── 분노 (low V, high A) ──────────────────────────────────────────────
    "화나":   (-0.85,  0.85), "화났어":  (-0.85,  0.85), "화가나":  (-0.85,  0.85),
    "분노":   (-0.90,  0.90), "열받아":  (-0.85,  0.90), "열받다":  (-0.85,  0.90),
    "짜증":   (-0.75,  0.70), "짜증나":  (-0.75,  0.70),
    "싫어":   (-0.70,  0.60), "싫다":    (-0.70,  0.60),
    "억울":   (-0.70,  0.65), "억울해":  (-0.70,  0.65),
    "미쳐":   (-0.65,  0.80),
    # ── 불안 · 두려움 · 스트레스 (low V, high A) ──────────────────────────
    "불안":   (-0.65,  0.75), "불안해":  (-0.65,  0.75), "불안하다":(-0.65,  0.75),
    "걱정":   (-0.55,  0.55), "걱정돼":  (-0.55,  0.55), "걱정된다":(-0.55,  0.55),
    "무서워": (-0.72,  0.80), "무섭다":  (-0.72,  0.80),
    "두려워": (-0.72,  0.75), "두렵다":  (-0.72,  0.75),
    "긴장":   (-0.45,  0.75), "긴장돼":  (-0.45,  0.75),
    "스트레스":(-0.65, 0.70), "압박":    (-0.55,  0.65),
    "초조":   (-0.55,  0.75), "초조해":  (-0.55,  0.75),
    # ── 슬픔 · 우울 · 외로움 (low V, low A) ──────────────────────────────
    "슬퍼":   (-0.80, -0.25), "슬프다":  (-0.80, -0.25), "슬픔":    (-0.80, -0.25),
    "우울":   (-0.80, -0.55), "우울해":  (-0.80, -0.55), "우울하다":(-0.80, -0.55),
    "힘들어": (-0.65, -0.15), "힘들다":  (-0.65, -0.15),
    "외로워": (-0.72, -0.45), "외롭다":  (-0.72, -0.45), "외로움":  (-0.72, -0.45),
    "지쳐":   (-0.60, -0.55), "지치다":  (-0.60, -0.55),
    "피곤":   (-0.50, -0.55), "피곤해":  (-0.50, -0.55),
    "공허":   (-0.70, -0.60), "공허해":  (-0.70, -0.60), "텅빈":    (-0.65, -0.55),
    "아파":   (-0.70, -0.10), "아프다":  (-0.70, -0.10),
    "상처":   (-0.70, -0.20), "상처받아":(-0.75, -0.20),
    "허무":   (-0.65, -0.50), "허무해":  (-0.65, -0.50),
    # ── 혼란 (near-neutral V, mid A) ──────────────────────────────────────
    "헷갈려": (-0.15,  0.35), "헷갈리다":(-0.15,  0.35),
    "복잡해": (-0.20,  0.35), "복잡하다":(-0.20,  0.35),
    "모르겠": ( 0.00,  0.20),
    # ── 중립/무감각 ────────────────────────────────────────────────────────
    "그냥":   ( 0.00,  0.00), "별로":    (-0.20,  0.00),
    "괜찮아": ( 0.20, -0.10), "괜찮다":  ( 0.20, -0.10),
}

# 부정어 패턴 (단어 앞 8자 이내)
_NEGATION_RE = re.compile(r"(안\s*|못\s*|없\s*|아니\s*|안돼\s*|아냐\s*)")

# ── 애매함 판단 임계값 ────────────────────────────────────────────────────────
_MIN_MATCH_FOR_CONFIDENT = 2   # 매칭 단어가 이보다 적으면 정보 부족
_VA_CONF_THRESH = 0.30         # |V| 또는 |A| 정규화 값이 이 미만이면 애매
_CONFLICT_THRESH = 0.50        # 긍/부정 단어가 함께 있고 차이가 이 이하면 혼합 신호


# ── Russell circumplex → emotion_code ────────────────────────────────────────

def _va_to_code(v: float, a: float) -> str:
    """VA 좌표를 EMOTION_CATEGORY.emotion_code 로 변환."""
    # 중립 영역
    if abs(v) < 0.15 and abs(a) < 0.15:
        return "NEUTRAL"

    if v >= 0:                              # 긍정 영역
        if a >= 0.5:
            return "EXCITED" if v < 0.5 else "HAPPY"
        if a >= 0:
            return "HAPPY" if v >= 0.5 else "CALM"
        return "GRATEFUL" if v >= 0.5 else "CALM"
    else:                                   # 부정 영역
        if a >= 0.6:
            if v <= -0.7:
                return "ANGRY"
            if v <= -0.5:
                return "FEAR"
            return "ANXIOUS"
        if a >= 0.2:
            if v <= -0.5:
                return "ANXIOUS"
            return "STRESSED" if v <= -0.3 else "CONFUSED"
        # low A
        if v <= -0.65:
            return "DEPRESSED" if a <= -0.3 else "SAD"
        if a <= -0.4:
            return "EMPTY" if v <= -0.5 else "TIRED"
        if v <= -0.5:
            return "SAD"
        if v <= -0.35:
            return "LONELY"
        return "HURT"


# ── 사전 기반 분석 ─────────────────────────────────────────────────────────────

@dataclass
class _DictResult:
    v_sum: float = 0.0
    a_sum: float = 0.0
    match_count: int = 0
    pos_count: int = 0   # valence > 0 단어 수
    neg_count: int = 0   # valence < 0 단어 수

    @property
    def v_norm(self) -> float:
        return self.v_sum / self.match_count if self.match_count else 0.0

    @property
    def a_norm(self) -> float:
        return self.a_sum / self.match_count if self.match_count else 0.0


def _dict_analyze(text: str) -> _DictResult:
    res = _DictResult()
    for word, (v, a) in _VA_DICT.items():
        if word not in text:
            continue
        idx = text.find(word)
        prefix = text[max(0, idx - 8): idx]
        sign = -1 if _NEGATION_RE.search(prefix) else 1
        res.v_sum += sign * v
        res.a_sum += sign * a
        res.match_count += 1
        if sign * v > 0:
            res.pos_count += 1
        else:
            res.neg_count += 1
    return res


def _is_ambiguous(dr: _DictResult) -> bool:
    """사전 결과가 애매한지 판단."""
    if dr.match_count == 0:
        return True
    if dr.match_count < _MIN_MATCH_FOR_CONFIDENT:
        if abs(dr.v_norm) < _VA_CONF_THRESH and abs(dr.a_norm) < _VA_CONF_THRESH:
            return True
    # 긍/부정 신호가 뒤섞인 경우
    if dr.pos_count > 0 and dr.neg_count > 0:
        conflict_ratio = min(dr.pos_count, dr.neg_count) / dr.match_count
        if conflict_ratio >= 0.4 and abs(dr.v_norm) < _CONFLICT_THRESH:
            return True
    return False


# ── LLM 폴백 ──────────────────────────────────────────────────────────────────

_LLM_SYSTEM = (
    "You are an emotion analysis assistant specializing in Korean text.\n"
    "Given a Korean sentence, output ONLY a JSON object with exactly two keys:\n"
    '  "valence": float between -1.0 (very negative) and 1.0 (very positive)\n'
    '  "arousal": float between -1.0 (very calm/low energy) and 1.0 (very excited/high energy)\n'
    "No explanation, no markdown, just the JSON."
)

_VA_JSON_RE = re.compile(r'\{[^}]*"valence"[^}]*\}', re.DOTALL)


def _parse_va_json(text: str) -> Optional[tuple[float, float]]:
    m = _VA_JSON_RE.search(text)
    if not m:
        return None
    try:
        data = json.loads(m.group())
        v = float(data["valence"])
        a = float(data["arousal"])
        return (max(-1.0, min(1.0, v)), max(-1.0, min(1.0, a)))
    except (KeyError, ValueError, json.JSONDecodeError):
        return None


def _llm_va(text: str) -> Optional[tuple[float, float]]:
    """LLM 에게 VA 점수를 요청. 실패 시 None 반환."""
    try:
        from services.llm_client import run_chat_completion
        reply = run_chat_completion(
            [
                {"role": "system", "content": _LLM_SYSTEM},
                {"role": "user",   "content": f"텍스트: {text}"},
            ],
            max_tokens=60,
        )
        return _parse_va_json(reply)
    except Exception:
        return None


# ── 공개 인터페이스 ───────────────────────────────────────────────────────────

@dataclass
class EmotionResult:
    emotion_code: str
    valence: float
    arousal: float
    by_llm: bool
    confidence: float          # 0.0 ~ 1.0 (사전 매칭 신뢰도)
    matched_words: list[str] = field(default_factory=list)


def analyze(text: str) -> EmotionResult:
    """
    1단계: 사전 기반 VA 분석
    2단계: 애매하면 LLM 폴백
    3단계: VA → emotion_code 변환
    """
    dr = _dict_analyze(text)

    # 사전 신뢰도 계산 (0~1)
    raw_conf = min(dr.match_count / 4.0, 1.0) * (
        1.0 - max(0.0, _CONFLICT_THRESH - abs(dr.v_norm)) / _CONFLICT_THRESH * 0.5
    )

    if _is_ambiguous(dr):
        va = _llm_va(text)
        if va is not None:
            v, a = va
            return EmotionResult(
                emotion_code=_va_to_code(v, a),
                valence=round(v, 4),
                arousal=round(a, 4),
                by_llm=True,
                confidence=round(raw_conf, 4),
            )
        # LLM도 실패하면 neutral 처리
        return EmotionResult(
            emotion_code="NEUTRAL",
            valence=0.0,
            arousal=0.0,
            by_llm=False,
            confidence=0.0,
        )

    v = round(dr.v_norm, 4)
    a = round(dr.a_norm, 4)
    matched = [w for w in _VA_DICT if w in text]
    return EmotionResult(
        emotion_code=_va_to_code(v, a),
        valence=v,
        arousal=a,
        by_llm=False,
        confidence=round(raw_conf, 4),
        matched_words=matched,
    )
