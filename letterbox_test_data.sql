-- =============================================================================
-- 쪽지함(Letter Box) 테스트 데이터 삽입 스크립트
-- 이 스크립트를 실행하면 1번 사용자(일반유저)와 1번 봇(강이) 사이에
-- 테스트용 쪽지 데이터들이 날짜별로, 읽음/안읽음 상태별로 생성됩니다.
-- =============================================================================

USE matey;

-- 1. BOT_LETTER_TYPE 데이터가 없다면 삽입 (프론트엔드 뱃지 처리에 사용되는 타입들)
INSERT IGNORE INTO BOT_LETTER_TYPE (letter_type_id, name, template) VALUES
(1, 'RECONNECT', '응원 쪽지 템플릿'),
(2, 'MIDNIGHT', '위로 쪽지 템플릿'),
(3, 'HIGH_RISK', '위로 쪽지 템플릿'),
(4, 'GIFT', '이벤트 쪽지 템플릿'),
(5, 'EMOTION_GROWTH', '감정성장 쪽지 템플릿');

-- 2. 1번 유저와 1번 봇 간의 EXCLUSIVE(담당봇) 관계가 없다면 강제로 생성
INSERT IGNORE INTO EXCLUSIVE (user_id, bot_id) 
VALUES (1, 1);

-- 3. 삽입한 EXCLUSIVE 관계의 ID를 변수에 저장
SET @exclusive_id = (SELECT exclusive_id FROM EXCLUSIVE WHERE user_id = 1 AND bot_id = 1 LIMIT 1);

-- 4. 테스트용 쪽지 데이터 삽입 (기존 테스트 데이터 삭제 후 삽입하여 중복 방지)
-- 만약 기존 쪽지까지 다 지우려면 아래 주석을 해제하세요.
-- DELETE FROM BOT_LETTER WHERE exclusive_id = @exclusive_id;

INSERT INTO BOT_LETTER (letter_type_id, exclusive_id, title, content, is_read, created_at, read_at) VALUES
-- ① 오늘 도착한 새 쪽지 (읽지 않음)
(1, @exclusive_id, '오늘 하루는 어땠어?', '조금 지친 날처럼 보여서 먼저 편지를 남겨둘게. 오늘 하루도 잘 버틴 것만으로도 충분해. 내일은 조금 더 편안한 하루가 되길 바랄게.', FALSE, NOW(), NULL),

-- ② 어제 도착한 새 쪽지 (읽지 않음)
(2, @exclusive_id, '잠들기 전에 한 번 읽어봐', '머릿속이 복잡해서 잠이 오지 않는다면, 아주 작은 것부터 내려놓는 연습을 해보는 건 어떨까? 내가 항상 여기서 이야기를 들어줄게.', FALSE, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),

-- ③ 3일 전 도착한 새 쪽지 (읽지 않음)
(5, @exclusive_id, '감정이 자라나는 중이야', '최근 네가 남긴 이야기들을 보니, 스스로 감정을 다스리는 힘이 조금씩 자라고 있는 게 느껴져. 정말 대단해!', FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),

-- ④ 5일 전 도착한 이벤트 쪽지 (읽지 않음)
(4, @exclusive_id, '깜짝 선물이 도착했어!', '항상 꾸준히 나를 찾아와줘서 고마워. 작은 마음을 담아 선물을 준비했으니 꼭 확인해봐!', FALSE, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),

-- ⑤ 1주일 전 도착한 쪽지 (읽음) - 내 쪽지 보관함용
(1, @exclusive_id, '조금 느려도 괜찮아', '속도를 줄인다고 해서 방향을 잃는 건 아니야. 천천히 가도 목적지에는 닿을 수 있으니까 너무 조급해하지 마.', TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),

-- ⑥ 2주일 전 도착한 쪽지 (읽음) - 내 쪽지 보관함용
(3, @exclusive_id, '많이 힘들었지?', '그동안 혼자 견디느라 수고 많았어. 네가 느끼는 감정은 모두 당연하고 소중한 거야. 절대 자책하지 않았으면 해.', TRUE, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY));

SELECT '테스트 쪽지 데이터 생성이 완료되었습니다!' AS Result;
