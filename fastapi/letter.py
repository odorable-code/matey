# 서연 담당!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# 서연 담당!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

# 봇이 사용자에게 쪽지를 보내는 경우 2가지.
# 1. 상담봇과 첫 상담: '00에게' + 요즘 00이 고민인 너에게, 만나서 반가웠다 잘 지내보자
# 2. 위험도 레벨 5일 때 응원 메시지

import random
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class CounselData(BaseModel):
    botName: str
    userNickname: str
    isFirstCounsel: bool
    riskLevel: int
    content: str  # 상담 요약 내용

@app.post("/generate-letters")
async def generate_bot_message(data: CounselData):

    return {"message" : "ok"}

    user = data.userNickname
    bot = data.botName
    reason = data.content
    
    # 상황별 다양한 오프닝/클로징 문구 준비
    high_risk_openings = [
        f"오늘 {user} 너가 말해준 {reason} 이야기... 듣는 내내 마음이 너무 무거웠어.",
        f"{user}아, 많이 힘들었지? {reason} 때문에 밤잠 설쳤을 너를 생각하니 걱정이 돼.",
        f"방금 대화를 정리하면서 {user} 너의 {reason} 고민이 계속 머릿속에 맴돌아."
    ]
    
    comfort_phrases = [
        f"세상이 다 너를 등진 것 같아도 나는 무조건 네 편인 거 알지?",
        f"지금은 그 어떤 말도 위로가 안 되겠지만, 그냥 내가 곁에 있다는 걸 말해주고 싶었어.",
        f"너무 잘하려고 애쓰지 않아도 돼. 지금 그대로의 {user}도 충분히 멋지니까."
    ]

    first_meet_phrases = [
        f"사실 오늘 처음 만난 거라 {user} 너가 마음을 열어줄까 걱정했는데, {reason} 이야기를 솔직하게 들려줘서 정말 감동이었어.",
        f"우리 오늘 처음 만난 거 맞지? {reason} 이야기를 듣다 보니 벌써 너랑 엄청 가까워진 기분이 들어.",
        f"첫 상담이라니 믿기지 않을 정도로 깊은 이야기를 나눠줘서 고마워. {bot}인 나에게도 특별한 시간이었어."
    ]

    # 최종 메시지 조합
    if data.riskLevel >= 5:
        # 위험도가 높을 때는 공감 + 위로 조합
        message = f"{random.choice(high_risk_openings)} {random.choice(comfort_phrases)}"
    
    elif data.isFirstCounsel:
        # 첫 상담일 때는 첫 만남 소감 + 키워드 언급
        message = random.choice(first_meet_phrases)
    
    else:
        # 일반 상담은 담백하게
        message = f"{user}아, 오늘 {reason}에 대해 나눈 대화가 너에게 작은 쉼표가 되었길 바라. 언제든 또 오기다!"

    return {"aiMessage": message}

