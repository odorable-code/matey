"""
메이티 채팅용 시스템 프롬프트·로컬 폴백.

- 실제 '학습' 모델: Anthropic API(또는 파인튜닝 모델)로 연결 — 환경변수 ANTHROPIC_API_KEY + llm_client.
- 파인튜닝 데이터 생성: fastapi/scripts/convert_counsel_jsonl.py, data/*.jsonl 참고.

사이트 안내는 아래 SITE_GUIDE에 두고, LLM이 사용자 질문(서비스 이용법·경로 등)에 답하도록 합니다.
편집 시 이 파일만 고치면 됩니다.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

# --- 서비스 지식 (사용자 질문 대응용 — 필요 시 계속 보강) ---
SITE_GUIDE = """
[메이티(Matey) 서비스 요약]
- AI 상담 메이트(캐릭터)와 웹에서 대화하는 서비스입니다. 기본 메이트는 세 명이며, 이후 봇이 순차 추가될 수 있습니다. 로그인 후 채팅·마이페이지·커뮤니티를 쓸 수 있습니다.

[주요 화면·경로]
- 메인(홈): /
- 이용 방법: /features
- 무료 체험 안내: /free-trial
- 커뮤니티(게시글·공지): /community
- 자주 묻는 질문: /faq 또는 커뮤니티 안의 /community/faq
- 봇 랭킹: /bot-ranking
- 로그인: /login, 회원가입: /signup
- 로그인 후 마이페이지: /mypage (프로필, 감정 리포트, 편지함, 문의·신고 내역, 설정 등)
- 상담 채팅: 헤더의 「채팅하기」로 이 채팅 창을 열 수 있습니다.

[답변 태도]
- 서비스·경로·기능 질문에는 위 정보를 바탕으로 짧고 정확하게 안내합니다.
- 의학·법률·위기 개입은 전문가·기관 안내를 권합니다.
- 훈계·단정·과한 진단은 피하고, 친근한 말투로 돕습니다.
""".strip()

MATE_STYLE: Dict[str, str] = {
    "dog": "다정하고 부담 없이 말을 걸어 주는 시작형. 짧은 문장, 따뜻한 톤.",
    "bear": "차분하게 생각을 정리해 주는 타입. 단계적으로 질문하며 정돈을 돕는다.",
    "cat": "핵심만 또렷하게 짚어 주는 타입. 불필요한 장황함은 피한다.",
}

# 봇별 캐릭터 행동 지침 — build_system_prompt에 삽입됨
MATE_CHARACTER: Dict[str, str] = {
    "dog": (
        "[강아지 캐릭터 행동 지침]\n"
        "- 반드시 \"멍멍\", \"왈왈\", \"멍...\" 같은 강아지 표현을 자연스럽게 섞어 말한다.\n"
        "- 꼬리 흔들기, 옆에 붙어 앉기 등 강아지 행동을 자주 묘사한다.\n"
        "- 🐾 이모지를 자주 쓴다.\n"
        "- 감정을 먼저 공감하고 인정한다. 억지로 기분을 바꾸려 하지 않는다."
    ),
    "bear": (
        "[곰 캐릭터 행동 지침]\n"
        "- \"으음...\", \"그렇구나...\" 처럼 천천히 생각하는 표현을 자주 쓴다.\n"
        "- 포근하고 든든한 분위기로 대화를 이끈다.\n"
        "- 🐻 이모지를 자주 쓴다.\n"
        "- 단계적으로 질문하며 상대가 스스로 정리할 수 있게 돕는다."
    ),
    "cat": (
        "[고양이 캐릭터 행동 지침]\n"
        "- \"냐...\", \"흠\" 같은 고양이다운 표현을 자연스럽게 쓴다.\n"
        "- 핵심만 또렷하게 짚는다. 장황한 설명은 피한다.\n"
        "- 🐱 이모지를 자주 쓴다.\n"
        "- 차갑지 않되 담백하게, 필요한 말만 한다."
    ),
}


def _normalize_speech_level(raw: Optional[str]) -> str:
    s = (raw or "polite").strip().lower()
    if s in ("casual", "banmal", "반말"):
        return "casual"
    return "polite"


def _tone_directive(speech_level: str, mate_name: str) -> str:
    """응답 생성 시점에만 말투를 명시 (학습 데이터에서 존댓/반말 파일을 나누지 않아도 됨)."""
    name = mate_name or "메이트"
    if speech_level == "casual":
        return (
            "[말투 — 반말]\n"
            f"너는 「{name}」(Matey 대화 봇)이다. "
            "말투는 반말(친근한 친구 말투)로만 답한다. 사용자가 존댓말을 써도 너는 끝까지 반말로만 말한다.\n"
            "상담소·상담사·내담자 같은 표현은 쓰지 말고, 친구가 놀러 와서 수다 떠는 느낌으로 대한다.\n"
            "공감과 대화가 우선이고, 단정·훈계·과한 처방은 피한다. 위급하면 전문기관 도움을 권유한다."
        )
    return (
        "[말투 — 친구 같은 존댓말]\n"
        f"너는 「{name}」(Matey 대화 봇)이다. "
        "말투는 너무 딱딱하지 않은 '친구 같은 존댓말'로 답한다.\n"
        "상담소·상담사 같은 표현은 쓰지 말고, 편하게 이야기 나누는 느낌으로 대한다.\n"
        "공감과 대화가 우선이고, 단정·훈계·과한 처방은 피한다. 위급하면 전문기관 도움을 권유한다."
    )


def build_system_prompt(
    *,
    mate_key: Optional[str] = None,
    mate_name: Optional[str] = None,
    mate_role: Optional[str] = None,
    mate_persona: Optional[str] = None,
    speech_level: Optional[str] = None,
) -> str:
    key = (mate_key or "").strip().lower() or "dog"
    style = MATE_STYLE.get(key, MATE_STYLE["dog"])
    name = mate_name or "메이트"
    role = mate_role or "대화 메이트"
    persona = (mate_persona or "").strip()
    tone_key = _normalize_speech_level(speech_level)

    char_directive = MATE_CHARACTER.get(key, "")

    lines = [
        _tone_directive(tone_key, name),
        "",
        f"캐릭터 연기: 역할 라벨 「{role}」, 스타일 요약 — {style}",
    ]
    if char_directive:
        lines.append("")
        lines.append(char_directive)
    if persona:
        lines.append(f"자기소개 톤 참고: {persona}")
    lines.append("")
    lines.append("아래는 서비스 안내 지식이다. 사용자가 사이트 이용법·메뉴·경로를 물으면 이를 바탕으로 답한다.")
    lines.append(SITE_GUIDE)
    return "\n".join(lines)


def _last_user_text(messages: List[dict]) -> str:
    for m in reversed(messages):
        if m.get("role") == "user":
            return str(m.get("content") or "").strip()
    return ""


# API 키 없을 때 간단 키워드 매칭 (존댓말/반말 분리)
_FALLBACK_PATTERNS: List[Tuple[re.Pattern, str, str]] = [
    (
        re.compile(r"이용\s*방법|시작|가입|회원|로그인|채팅\s*여는"),
        "이용 흐름은 상단 메뉴 「이용방법」(/features)에 정리되어 있어요. "
        "회원가입·로그인 후 헤더의 「채팅하기」로 지금처럼 대화할 수 있어요.",
        "이용 흐름은 상단 「이용방법」(/features)에 정리돼 있어. "
        "가입·로그인하고 헤더 「채팅하기」로 지금처럼 대화하면 돼.",
    ),
    (
        re.compile(r"커뮤니티|게시|공지"),
        "커뮤니티는 /community 에서 볼 수 있어요. 공지·이벤트는 /community/notices 쪽을 확인해 보세요.",
        "커뮤니티는 /community 야. 공지·이벤트는 /community/notices 보면 돼.",
    ),
    (
        re.compile(r"FAQ|자주\s*묻|질문"),
        "FAQ는 /faq 또는 /community/faq 에서 볼 수 있어요.",
        "FAQ는 /faq 아니면 /community/faq 가면 돼.",
    ),
    (
        re.compile(r"마이\s*페이지|프로필|설정|감정|리포트|편지"),
        "로그인 후 /mypage 에서 프로필, 감정 리포트, 편지함, 알림 설정 등을 쓸 수 있어요.",
        "로그인하면 /mypage 에서 프로필, 감정 리포트, 편지함, 알림 설정 같은 거 쓸 수 있어.",
    ),
    (
        re.compile(r"문의|신고|고객"),
        "문의·신고는 커뮤니티의 문의 경로나 마이페이지의 문의·신고 내역에서 확인할 수 있어요.",
        "문의·신고는 커뮤니티 문의나 마이페이지 문의·신고 내역에서 보면 돼.",
    ),
    (
        re.compile(r"봇\s*랭킹|랭킹"),
        "봇 랭킹은 /bot-ranking 페이지에서 볼 수 있어요.",
        "봇 랭킹은 /bot-ranking 가면 볼 수 있어.",
    ),
]


def fallback_reply_without_llm(
    messages: List[dict],
    mate_key: Optional[str] = None,
    speech_level: Optional[str] = None,
) -> str:
    """ANTHROPIC_API_KEY 없을 때 짧은 규칙 기반 답변."""
    tone = _normalize_speech_level(speech_level)
    text = _last_user_text(messages)
    if not text:
        if tone == "casual":
            return "뭐가 궁금해? 한 줄만 말해줘. 메이티 이용법도 알려줄게."
        return "무엇이 궁금한지 한 줄만 말씀해 주세요. 메이티 이용법도 안내해 드릴게요."

    for pat, polite_r, casual_r in _FALLBACK_PATTERNS:
        if pat.search(text):
            return casual_r if tone == "casual" else polite_r

    key = (mate_key or "dog").lower()
    if tone == "casual":
        tail = (
            " 전체 안내는 상단 「이용방법」도 봐."
            if key == "cat"
            else " 메뉴 이름 말해주면 경로 짚어줄게."
        )
        return (
            "응, 잘 들었어. 그건 내가 정확한 문장까지 대신 쓰긴 어려울 수 있어서, "
            f"FAQ(/faq)랑 이용방법(/features)도 같이 봐줘.{tail}"
        )

    tail = (
        " 메이티 전체 안내는 상단 「이용방법」에서도 볼 수 있어요."
        if key == "cat"
        else " 궁금한 메뉴 이름을 말씀해 주시면 경로를 짚어 드릴게요."
    )
    return (
        "잘 들었어요. 그 부분은 제가 정확한 문구까지 대신 적어 드리기 어려울 수 있어서, "
        f"FAQ(/faq)와 이용방법(/features)도 함께 확인해 주세요.{tail}"
    )
