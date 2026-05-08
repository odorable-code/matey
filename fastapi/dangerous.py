import os
import pandas as pd
from konlpy.tag import Okt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

# 형태소 분석기 초기화
okt = Okt()

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

# --- 데이터 로드 및 전처리 ---
folder_path = r'C:\Users\hi6\Documents\위험도 분류를 위한 데이터셋' 
all_docs = []
file_names = []

print("데이터 전처리 중...")
for filename in os.listdir(folder_path):
    if filename.endswith('.txt'):
        with open(os.path.join(folder_path, filename), 'r', encoding='utf-8') as f:
            content = f.read()
            # 파일 읽기 직후 전처리 함수 적용
            clean_text = preprocess_text(content)
            all_docs.append(clean_text)
            file_names.append(filename)

# --- 벡터화 및 군집화 ---
# 전처리가 이미 되었으므로 TfidfVectorizer는 간단하게 설정
vectorizer = TfidfVectorizer(max_features=1000)
x_matrix = vectorizer.fit_transform(all_docs)

# K-means (위험도 1~5단계를 위해 5개 군집)
kmeans = KMeans(n_clusters=5, n_init=10, random_state=42)
kmeans.fit(x_matrix)

# --- 결과 정리 및 출력 ---
results = pd.DataFrame({
    '파일명': file_names,
    '군집번호': kmeans.labels_
})

print("\n" + "="*50)
print("--- 각 군집을 대표하는 핵심 키워드 ---")
print("이 키워드들을 보고 위험도(1~5)를 매칭하세요.")
print("="*50)

centroids = kmeans.cluster_centers_.argsort()[:, ::-1]
terms = vectorizer.get_feature_names_out()

for i in range(5):
    print(f"[군집 {i}] 주요 단어: ", end="")
    for ind in centroids[i, :10]: # 상위 10개 단어 출력
        print(f"{terms[ind]} ", end="")
    print("\n")

# 군집번호 순으로 정렬하여 출력
print("--- 파일별 군집 결과 ---")
print(results.sort_values(by='군집번호'))

# 필요시 CSV 저장
# results.to_csv('clustering_result.csv', index=False, encoding='utf-8-sig')