-- ======================================================
-- 친밀도 LEVEL 및 상호작용 테스트용 데이터 (최종 수정본)
-- 대상 사용자: user1@test.com
-- 대상 봇: 1번 봇 (기본 봇)
-- ======================================================

-- 0. 봇 데이터 생성 (외래키 에러 방지)
INSERT IGNORE INTO BOT (bot_id, name, selection_preview) 
VALUES (1, '메이티', '안녕하세요! 당신의 친구 메이티입니다.');

-- 1. 친밀도 단계 정의 (기존 데이터가 없을 경우를 대비)
INSERT IGNORE INTO INTIMACY_LEVEL (intimacy_id, level_description, intimacy_standard) VALUES
(1, '서먹한 사이', 0),
(2, '조금 친해진 사이', 100),
(3, '친한 친구', 200),
(4, '단짝 친구', 300),
(5, '가족 같은 사이', 400);

-- 2. 사용자(user1@test.com)와 봇(1번 봇)의 전용 관계(EXCLUSIVE) 생성
INSERT IGNORE INTO EXCLUSIVE (user_id, bot_id) 
SELECT u.user_id, 1 
FROM USER u 
WHERE u.email = 'user1@test.com';

-- 3. 실제 친밀도 레벨 및 경험치 데이터 설정 (Lv.1, 경험치 50%)
INSERT INTO USER_BOT_RELATION (exclusive_id, intimacy_id, current_exp, created_at, last_fed_at)
SELECT 
    e.exclusive_id, 
    1,   -- 현재 레벨 (Lv.1)
    50,  -- 현재 경험치 (50%)
    NOW(),
    NOW()
FROM EXCLUSIVE e
JOIN USER u ON e.user_id = u.user_id
WHERE u.email = 'user1@test.com' AND e.bot_id = 1
ON DUPLICATE KEY UPDATE 
    intimacy_id = 1, 
    current_exp = 50,
    last_fed_at = NOW();
