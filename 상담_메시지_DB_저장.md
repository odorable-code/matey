1. 감정 카테고리 테이블

감정 종류를 하드코딩하지 않기 위한 테이블이다.

CREATE TABLE emotion_category (
    emotion_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    emotion_code VARCHAR(30) NOT NULL UNIQUE,
    emotion_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
예시 데이터
emotion_id	emotion_code	emotion_name
1	ANGER	분노
2	SADNESS	슬픔
3	ANXIETY	불안
4	JOY	기쁨
5	NEUTRAL	중립
2. 메시지 분석 테이블

분석 1건의 대표 결과를 저장한다.

CREATE TABLE message_analysis (
    analysis_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,

    dominant_emotion_id BIGINT NULL,
    risk_level TINYINT DEFAULT 0,
    is_high_risk BOOLEAN DEFAULT FALSE,

    model_name VARCHAR(100) NULL,
    model_version VARCHAR(50) NULL,

    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (message_id)
);
의미
컬럼	설명
message_id	분석 대상 사용자 메시지
dominant_emotion_id	가장 높은 감정
risk_level	위험도
model_name	분석 모델명
model_version	분석 모델 버전
3. 감정별 점수 테이블

여기에 감정별 % 또는 score를 저장한다.

CREATE TABLE message_emotion_score (
    score_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    emotion_id BIGINT NOT NULL,

    emotion_score DECIMAL(6,4) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (analysis_id, emotion_id)
);
저장 예시
score_id	analysis_id	emotion_id	emotion_score
1	10	1	0.0200
2	10	2	0.0020
3	10	3	0.6500
4	10	5	0.3280

2.0%는 0.0200으로 저장하는 걸 추천한다.
즉, DB에는 0~1 사이 소수로 저장하고 화면에서만 %로 변환한다.

전체 관계
MESSAGE
- message_id

MESSAGE_ANALYSIS
- analysis_id
- message_id
- dominant_emotion_id

MESSAGE_EMOTION_SCORE
- score_id
- analysis_id
- emotion_id
- emotion_score

EMOTION_CATEGORY
- emotion_id
- emotion_code
- emotion_name