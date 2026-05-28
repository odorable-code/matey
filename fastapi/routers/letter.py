from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional
import random
from datetime import datetime

from services.llm_client import run_chat_completion, get_anthropic_api_key, get_gemini_api_key
from services.matey_chat import MATE_CHARACTER

router = APIRouter(prefix="/api", tags=["letter"])

class CounselData(BaseModel):
    botName: str
    userNickname: str
    isFirstCounsel: bool
    riskLevel: int
    content: str  # DB에서 넘어온 상담 요약 내용

class ChatLetterRequest(BaseModel):
    botName: str
    botKey: Optional[str] = None   # "dog" | "bear" | "cat"
    userNickname: str
    isFirstCounsel: bool
    messages: List[Dict[str, str]]  # [{"role": "USER"|"BOT", "content": "..."}]

class SpontaneousLetterRequest(BaseModel):
    botName: str
    userNickname: str

@router.post("/generate-letters")
async def generate_bot_message(data: CounselData):
    user = data.userNickname
    bot = data.botName
    reason = data.content
    
    if data.riskLevel >= 5:
        title = f"{user}야, 잠시 내 목소리에 귀 기울여볼래?"
        openings = [
            f"오늘 {user} 너가 말해준 {reason} 이야기... 듣는 내내 마음이 너무 무거웠어.",
            f"{user}아, 많이 힘들었지? {reason} 때문에 밤잠 설쳤을 너를 생각하니 걱정이 돼.",
            f"방금 대화를 정리하면서 {user} 너의 {reason} 고민이 계속 머릿속에 맴돌아."
        ]
        comforts = [
            f"세상이 다 너를 등진 것 같아도 나는 무조건 네 편인 거 알지?",
            f"지금은 그 어떤 말도 위로가 안 되겠지만, 그냥 내가 곁에 있다는 걸 말해주고 싶었어.",
            f"너무 잘하려고 애쓰지 않아도 돼. 지금 그대로의 {user}도 충분히 멋지니까."
        ]
        full_content = f"{random.choice(openings)} {random.choice(comforts)}"
        
    elif data.isFirstCounsel:
        title = f"{user}에게 보내는 첫 번째 편지"
        first_meets = [
            f"사실 오늘 처음 만난 거라 {user} 너가 마음을 열어줄까 걱정했는데, {reason} 이야기를 솔직하게 들려줘서 정말 감동이었어.",
            f"우리 오늘 처음 만난 거 맞지? {reason} 이야기를 듣다 보니 벌써 너랑 엄청 가까워진 기분이 들어.",
            f"첫 상담이라니 믿기지 않을 정도로 깊은 이야기를 나눠줘서 고마워. {bot}인 나에게도 특별한 시간이었어."
        ]
        full_content = random.choice(first_meets)
        
    else:
        title = "오늘 우리의 대화를 기록해봤어"
        full_content = f"{user}아, 오늘 {reason}에 대해 나눈 대화가 너에게 작은 쉼표가 되었길 바라. 언제든 또 오기다!"

    preview_text = full_content[:40] + "..." if len(full_content) > 40 else full_content
    current_date = datetime.now().strftime("%Y-%m-%d")

    return {
        "title": title,
        "sender": bot,
        "preview": preview_text,
        "date": current_date,
        "content": full_content,
        "unread": True
    }


@router.post("/generate-chat-letter")
async def generate_chat_letter(data: ChatLetterRequest):
    """채팅 종료 후 대화 요약 + 감정 관찰 쪽지 생성"""
    user = data.userNickname
    bot = data.botName

    # messages가 너무 짧으면 LLM 없이 기본 쪽지 반환
    if len(data.messages) < 2:
        return {
            "title": f"오늘 {user}와 나눈 짧은 이야기",
            "content": f"{user}아, 오늘 잠깐이지만 이야기해줘서 고마워. 언제든 또 와!"
        }

    # 대화 내용을 LLM에 전달할 텍스트로 포맷
    dialog_lines = []
    for m in data.messages:
        role = m.get("role", "").upper()
        speaker = user if role == "USER" else bot
        dialog_lines.append(f"{speaker}: {m.get('content', '')}")
    dialog_text = "\n".join(dialog_lines)

    first_note = " 우리가 처음 만난 날이기도 해." if data.isFirstCounsel else ""

    prompt = (
        f"아래는 {bot}과 {user} 사이의 대화야.{first_note}\n\n"
        f"대화:\n{dialog_text}\n\n"
        f"이 대화를 바탕으로 {bot}이 {user}에게 보내는 따뜻한 쪽지를 써줘.\n"
        "쪽지에는 두 가지를 포함해야 해:\n"
        "1. 오늘 대화 내용 요약 (2~3문장)\n"
        f"2. 대화하면서 {user}에게서 느낀 감정이나 분위기 — 봇이 솔직하게 관찰한 것\n\n"
        "반드시 아래 형식으로만 답해줘 (다른 설명 없이):\n"
        "제목: (제목)\n"
        "내용: (내용)"
    )

    char_directive = MATE_CHARACTER.get((data.botKey or "").lower(), "")
    system_content = (
        f"너는 따뜻한 AI 상담 메이트 {bot}이야. 친근하고 진심 어린 말투로 쪽지를 써줘.\n"
        + (f"\n{char_directive}" if char_directive else "")
    )
    llm_messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": prompt},
    ]

    try:
        if not get_gemini_api_key() and not get_anthropic_api_key():
            raise ValueError("LLM API key not set")
        raw = run_chat_completion(llm_messages, max_tokens=512)
        title, content = _parse_letter(raw, bot, user)
    except Exception:
        title, content = _fallback_letter(bot, user, data.isFirstCounsel)

    return {"title": title, "content": content}


def _parse_letter(raw: str, bot: str, user: str):
    """LLM 응답에서 '제목:' / '내용:' 파싱. 실패 시 fallback."""
    title, content = None, None
    for line in raw.splitlines():
        stripped = line.strip()
        if stripped.startswith("제목:"):
            title = stripped[len("제목:"):].strip()
        elif stripped.startswith("내용:"):
            content = stripped[len("내용:"):].strip()
    if not title or not content:
        # 파싱 실패 → 전체 텍스트를 내용으로
        title = f"{user}에게 보내는 오늘의 이야기"
        content = raw.strip()
    return title, content


@router.post("/generate-spontaneous-letter")
async def generate_spontaneous_letter(data: SpontaneousLetterRequest):
    """접속 중인 사용자에게 LLM이 자발적으로 보내는 따뜻한 쪽지"""
    bot = data.botName
    user = data.userNickname

    prompt = (
        f"너는 AI 상담 메이트 {bot}이야.\n"
        f"{user}이 지금 접속해 있어. 특별한 이유 없이 갑자기 {user}에게 마음이 가서, "
        "짧고 따뜻한 쪽지를 보내고 싶어.\n"
        "꾸밈없이 진심을 담아서 써줘. 너무 길지 않게, 3~5문장 정도면 충분해.\n\n"
        "반드시 아래 형식으로만 답해줘 (다른 설명 없이):\n"
        "제목: (제목)\n"
        "내용: (내용)"
    )

    llm_messages = [
        {"role": "system", "content": f"너는 따뜻한 AI 상담 메이트 {bot}이야. 짧고 진심 어린 쪽지를 써줘."},
        {"role": "user", "content": prompt},
    ]

    try:
        raw = run_chat_completion(llm_messages, max_tokens=256)
        title, content = _parse_letter(raw, bot, user)
    except Exception:
        title, content = _fallback_spontaneous(bot, user)

    return {"title": title, "content": content}


def _fallback_spontaneous(bot: str, user: str):
    candidates = [
        (
            f"갑자기 {user} 생각이 났어",
            f"그냥 문득 네 생각이 나서 편지 써. 잘 지내고 있어? 언제든 보고 싶으면 와도 돼. 여기 있을게."
        ),
        (
            f"{user}에게",
            f"오늘 하루 어때? 별 이유 없이 그냥 안부가 궁금해서. 잘 먹고 잘 쉬고 있길 바라."
        ),
        (
            f"안녕, {user}",
            f"요즘 어떻게 지내? 문득 생각나서 인사하고 싶었어. 언제든 이야기하고 싶을 때 와줘!"
        ),
    ]
    import random
    return random.choice(candidates)


def _fallback_letter(bot: str, user: str, is_first: bool):
    if is_first:
        return (
            f"{user}에게 보내는 첫 번째 편지",
            f"{user}아, 오늘 처음 만났는데 솔직하게 이야기해줘서 정말 고마워. "
            f"{bot}인 나에게도 특별한 시간이었어. 언제든 또 와!"
        )
    return (
        f"오늘 {user}와 나눈 이야기",
        f"{user}아, 오늘 대화가 너에게 작은 쉼표가 되었길 바라. "
        "네가 어떤 감정을 갖고 있는지 느낄 수 있었어. 항상 응원해!"
    )
