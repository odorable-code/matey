import os
import json
import pandas as pd
from dotenv import load_dotenv
from konlpy.tag import Okt
from google import genai
from google.genai import types

# 1. 초기화 및 환경 변수 로드
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY)
okt = Okt()

def preprocess_text(text):
    """
    상담 텍스트 전처리: 토큰 절약을 위해 명사/형용사만 추출
    """
    text = text.replace('[CLS]', '').replace('[SEP]', '')
    pos_result = okt.pos(text, stem=True)
    
    custom_stop_words = ['상담사', '내담자', '선생님', '네네', '거기', '저희', '오늘', '하나', '조금', '이건', '저번', '그게', '그것']
    
    meaningful_words = [
        word for word, pos in pos_result 
        if pos in ['Noun', 'Adjective'] 
        and len(word) > 1 
        and word not in custom_stop_words
    ]
    return " ".join(meaningful_words)

def classify_risk_with_gemini(clean_text):
    """
    Gemini API를 사용하여 위험도 분류 (JSON 모드 사용)
    """
    # return {'message' : "ok"}

    prompt = f"""
    당신은 전문 심리 상담가이자 위험 관리 전문가입니다.
    제시된 상담 키워드를 분석하여 내담자의 위험도를 1(매우 낮음)에서 5(매우 높음) 단계로 분류하세요.

    [판단 기준]
    - 1단계: 일상적인 고민, 가벼운 스트레스
    - 2단계: 가벼운 우울감, 불안
    - 3단계: 중등도의 우울감, 반복적인 고통 호소
    - 4단계: 심각한 절망감, 자해 사고 혹은 구체적인 위기 징후
    - 5단계: 즉각적인 개입이 필요한 자살 위기 및 긴급 상황

    상담 키워드: {clean_text}

    결과는 반드시 아래의 JSON 형식으로만 답변하세요:
    {{"risk_level": 숫자, "reason": "한 문장 요약"}}
    """

    try:
        # SDK에 맞는 호출 방식 및 모델명 수정
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json", # JSON 출력 강제
                temperature=0
            )
        )
        
        # 결과 파싱
        return json.loads(response.text)
    except Exception as e:
        print(f"⚠️ 분석 중 오류 발생: {e}")
        return {"risk_level": 0, "reason": "분석 실패"}

# --- 데이터 로드 및 실행 ---
folder_path = r'C:\Users\hi6\Documents\테스트용 위험도 분류' 
all_results = []

if not os.path.exists(folder_path):
    print(f"폴더를 찾을 수 없습니다: {folder_path}")
else:
    print("🚀 데이터 분석 시작 (Gemini API 활용)...")
    file_list = [f for f in os.listdir(folder_path) if f.endswith('.txt')]

    for filename in file_list:
        with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as f:
            content = f.read()
            
            # 1. 전처리
            clean_text = preprocess_text(content)
            
            # 2. AI 판정
            print(f"🔍 [{filename}] 분석 중...")
            analysis = classify_risk_with_gemini(clean_text)

            print(f"   ㄴ AI 응답: {analysis}")
            
            # 3. 결과 저장
            all_results.append({
                '파일명': filename,
                '위험도': analysis.get('risk_level', 0)
            })

            # --- [핵심 수정] 1분에 15번 제한을 피하기 위해 4~5초 정도 쉽니다 ---
            time.sleep(4)

    # --- 결과 정리 및 저장 ---
    if all_results:
        df_final = pd.DataFrame(all_results)
        print("\n" + "="*50)
        print("--- 최종 위험도 분류 결과 (위험도 높은 순) ---")
        # 위험도 숫자로 변환 후 정렬
        df_final['위험도'] = pd.to_numeric(df_final['위험도'], errors='coerce')
        print(df_final.sort_values(by='위험도', ascending=False))
        print("="*50)

        df_final.to_csv('risk_analysis_results.csv', index=False, encoding='utf-8-sig')
        print("분석 완료! 'risk_analysis_results.csv' 파일을 확인하세요.")
    else:
        print("파일이 없거나 분석된 데이터가 없습니다.")