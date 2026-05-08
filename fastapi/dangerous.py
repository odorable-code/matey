# 서연 담당!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
# 서연 담당!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
import os
import pandas as pd
from konlpy.tag import Okt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from google import genai
from google.genai import types

# 형태소 분석기 초기화
okt = Okt()
api_key = ''
client = genai.Client(api_key)

def preprocess_text(text):
    """
    상담 텍스트 전처리: 특수 토큰 제거, 명사/형용사 추출, 불용어 제거
    """
    # 1. 특수 토큰 및 기호 제거
    text = text.replace('[CLS]', '').replace('[SEP]', '')
    
    # 2. 형태소 분석 (stem=True로 원형 복원)
    pos_result = okt.pos(text, stem=True)
    
    # 3. 불용어 및 필터링 설정
    custom_stop_words = [
        '상담사', '내담자', '선생님', '네네', '거기', '저희', 
        '오늘', '하나', '조금', '이건', '저번', '그게', '그것'
    ]
    
    # 4. 명사(Noun)와 형용사(Adjective)만 선택 + 한 글자 단어 제외 + 불용어 제외
    meaningful_words = [
        word for word, pos in pos_result 
        if pos in ['Noun', 'Adjective'] 
        and len(word) > 1 
        and word not in custom_stop_words
    ]
    
    return " ".join(meaningful_words)

def classify_risk_with_claude(clean_text):
    """
    Claude API를 사용하여 위험도 분류 및 이유 추출
    """
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
        message = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=300,
            temperature=0, # 일관된 결과를 위해 0 설정
            messages=[{"role": "user", "content": prompt}]
        )
        # 결과 파싱 (JSON 형태의 문자열을 딕셔너리로 변환)
        import json
        result = json.loads(message.content[0].text)
        return result
    except Exception as e:
        print(f"API 호출 중 오류 발생: {e}")
        return {"risk_level": "Error", "reason": "N/A"}

# --- 데이터 로드 및 실행 ---
folder_path = r'C:\Users\hi6\Documents\위험도 분류를 위한 데이터셋' 
all_results = []

print("데이터 분석 시작 (Claude API 활용)...")

# 폴더 내 모든 txt 파일 처리
for filename in os.listdir(folder_path):
    if filename.endswith('.txt'):
        with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as f:
            content = f.read()
            
            # 1. 전처리 (텍스트 길이를 줄여 API 비용 절감)
            clean_text = preprocess_text(content)
            
            # 2. Claude에게 위험도 판정 요청
            print(f"[{filename}] 분석 중...")
            analysis = classify_risk_with_claude(clean_text)
            
            # 3. 결과 저장
            all_results.append({
                '파일명': filename,
                '위험도': analysis['risk_level'],
                '판단사유': analysis['reason']
            })

# --- 결과 정리 및 저장 ---
df_final = pd.DataFrame(all_results)

print("\n" + "="*50)
print("--- 최종 위험도 분류 결과 ---")
print(df_final.sort_values(by='위험도', ascending=False)) # 위험도 높은 순 정렬
print("="*50)

# CSV 파일로 저장
df_final.to_csv('risk_analysis_results.csv', index=False, encoding='utf-8-sig')
print("분류 완료! 'risk_analysis_results.csv' 파일을 확인하세요.")