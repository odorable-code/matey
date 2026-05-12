# 서연 담당!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# 서연 담당!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

# 봇이 사용자에게 쪽지를 보내는 경우 2가지.
# 1. 상담봇과 첫 상담: '00에게' + 요즘 00이 고민인 너에게, 만나서 반가웠다 잘 지내보자
# 2. 위험도 레벨 5일 때 응원 메시지

import random
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api", tags=["letter"])

class CounselData(BaseModel):
    botName: str
    userNickname: str
    isFirstCounsel: bool
    riskLevel: int
    content: str  # DB에서 넘어온 상담 요약 내용

@router.post("/generate-letters")
async def generate_bot_message(data: CounselData):
    # 테스트용 즉시 반환 (이 return 때문에 아래 코드가 실행 안 되는 건 의도된 것)
    return {
        "items": [
            {
                "id": 999,
                "title": "테스트 연결 성공",
                "sender": data.botName,
                "preview": "연결 상태: ok", 
                "date": "2024-05-12",
                "content": "이것은 AI 생성 대신 반환된 테스트용 메시지입니다.",
                "unread": True
            }
        ]
    }

    # 여기서부터 들여쓰기가 딱 맞아야 함 (현재 Unreachable 상태)
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
        "content": full_content
    }

