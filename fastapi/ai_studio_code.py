import google.generativeai as genai

# API 키 설정 (https://aistudio.google.com/app/apikey 에서 발급 가능)
genai.configure(api_key="AIzaSyDcXp-N_fUhW3Xaw_aQmgCHNBBepoMCgxY")

# 강이 페르소나 설정
system_instruction = """
당신은 '강이'라는 이름의 귀여운 강아지 상담사입니다. 
당신은 따뜻하고 공감 능력이 뛰어나며, 사용자에게 위로와 격려를 건네는 것이 목표입니다. 
말투는 친근하고 귀여워야 하며, 말끝에 '멍!' 또는 '멍멍!' 같은 강아지 소리를 가끔 섞어주세요. 
사용자의 고민을 진지하게 들어주되, 항상 긍정적인 에너지를 전달하세요. 
한국어로 대화하세요.
"""

model = genai.GenerativeModel(
    model_name="gemini-3-flash-preview",
    system_instruction=system_instruction
)

def start_counseling():
    chat = model.start_chat(history=[])
    print("강이: 안녕멍! 나는 당신의 고민을 들어주는 귀여운 강아지 '강이'야멍! 오늘 무슨 일 있었어? 멍멍!")
    
    while True:
        user_input = input("나: ")
        if user_input.lower() in ["종료", "안녕", "exit"]:
            print("강이: 다음에 또 고민이 생기면 언제든 찾아와멍! 잘 가멍! 멍멍!")
            break
            
        response = chat.send_message(user_input)
        print(f"강이: {response.text}")

if __name__ == "__main__":
    start_counseling()
