-- ==================================================
-- BOT / BOT_MOTION 시드
-- - 프론트 에셋(frontend/public/images/mascots/*) 기준으로 BOT_MOTION을 채웁니다.
-- - BOT.name 은 코드에서 botKey 로 쓰이므로 dog/bear/cat/hamster 로 맞춥니다.
-- - 실행 전: matey DB 선택(USE matey;)
-- ==================================================

-- 안전하게 다시 돌릴 수 있게(중복 방지) botKey 기준으로 먼저 정리합니다.
-- (BOT_MOTION에 FK가 있어서, BOT_MOTION → BOT 순서로 삭제/삽입)

SET @botDog := (SELECT bot_id FROM BOT WHERE name = 'dog' LIMIT 1);
SET @botBear := (SELECT bot_id FROM BOT WHERE name = 'bear' LIMIT 1);
SET @botCat := (SELECT bot_id FROM BOT WHERE name = 'cat' LIMIT 1);
SET @botHamster := (SELECT bot_id FROM BOT WHERE name = 'hamster' LIMIT 1);

DELETE FROM BOT_MOTION WHERE bot_id IN (
  COALESCE(@botDog, -1),
  COALESCE(@botBear, -1),
  COALESCE(@botCat, -1),
  COALESCE(@botHamster, -1)
);

DELETE FROM BOT WHERE name IN ('dog', 'bear', 'cat', 'hamster');

-- ------------------------------
-- 1) BOT (설명/프리뷰 문구)
--   - 메인(HomePage 카드/hero) + 채팅(ChatModal 픽) 톤에 맞춘 문구
-- ------------------------------
INSERT INTO BOT (name, avatar_image, description, selection_preview, like_count, dislike_count, reset_at)
VALUES
  (
    'dog',
    '/images/mascots/dog/dog.png',
    '처음 접속한 사용자가 부담 없이 대화를 시작할 수 있도록 편안하고 따뜻한 분위기로 안내해요.',
    '처음 말을 꺼내기 쉬운 다정한 시작형',
    0,
    0,
    NOW()
  ),
  (
    'bear',
    '/images/mascots/bear/bear.png',
    '머릿속이 엉켜 있을 때 흐름을 차분히 풀어내고 핵심을 정돈해주는 메이트예요.',
    '복잡한 마음을 차분히 정리해주는 타입',
    0,
    0,
    NOW()
  ),
  (
    'cat',
    '/images/mascots/cat/cat.png',
    '질문이 많거나 헷갈리는 게 있을 때, 중요한 포인트를 빠르게 짚어주는 메이트예요.',
    '핵심만 빠르게 짚어주는 또렷한 타입',
    0,
    0,
    NOW()
  ),
  (
    'hamster',
    '/images/mascots/hamster/hamster.png',
    '걱정이 많거나 말 꺼내기 조심스러울 때, 부드러운 낮춤 톤으로 천천히 곁에 있어줘요.',
    '망설이는 마음을 다독여주는 안심형',
    0,
    0,
    NOW()
  );

SET @botDog := (SELECT bot_id FROM BOT WHERE name = 'dog' LIMIT 1);
SET @botBear := (SELECT bot_id FROM BOT WHERE name = 'bear' LIMIT 1);
SET @botCat := (SELECT bot_id FROM BOT WHERE name = 'cat' LIMIT 1);
SET @botHamster := (SELECT bot_id FROM BOT WHERE name = 'hamster' LIMIT 1);

-- ------------------------------
-- 2) BOT_MOTION
-- motion_group 규칙(프로젝트 MyPageMapper 기준):
-- - COMMON : 기본(항상 보유)
-- - EMOTION: 감정/상황 모션
-- - SPECIAL: 특수(친밀도에 따라 잠금 해제)
-- ------------------------------

-- 공통 모션(기본)
INSERT INTO BOT_MOTION (bot_id, motion_code, motion_name, motion_group, asset_url, unlock_intimacy_level)
VALUES
  (@botDog,     'HELLO',   '인사',       'COMMON',  '/images/mascots/dog/hello.png',    0),
  (@botDog,     'WAITING', '기다림',     'COMMON',  '/images/mascots/dog/waiting.png',  0),
  (@botBear,    'HELLO',   '인사',       'COMMON',  '/images/mascots/bear/hello.png',   0),
  (@botBear,    'WAITING', '기다림',     'COMMON',  '/images/mascots/bear/waiting.png', 0),
  (@botCat,     'HELLO',   '인사',       'COMMON',  '/images/mascots/cat/hello.png',    0),
  (@botCat,     'WAITING', '기다림',     'COMMON',  '/images/mascots/cat/waiting.png',  0),
  (@botHamster, 'HELLO',   '인사',       'COMMON',  '/images/mascots/hamster/hello.png',   0),
  (@botHamster, 'WAITING', '기다림',     'COMMON',  '/images/mascots/hamster/waiting.png', 0);

-- 감정/상황 모션
INSERT INTO BOT_MOTION (bot_id, motion_code, motion_name, motion_group, asset_url, unlock_intimacy_level)
VALUES
  (@botDog,     'WORRY',       '걱정',       'EMOTION', '/images/mascots/dog/worry.png',       1),
  (@botDog,     'TEARS',       '눈물',       'EMOTION', '/images/mascots/dog/tears.png',       1),
  (@botDog,     'ANGER',       '화남',       'EMOTION', '/images/mascots/dog/anger.png',       1),
  (@botDog,     'CURIOSITY',   '호기심',     'EMOTION', '/images/mascots/dog/curiosity.png',   1),
  (@botDog,     'COMPLIMENTS', '칭찬',       'EMOTION', '/images/mascots/dog/compliments.png', 1),
  (@botDog,     'STRETCH',     '스트레칭',   'EMOTION', '/images/mascots/dog/stretch.png',     1),

  (@botBear,    'WORRY',       '걱정',       'EMOTION', '/images/mascots/bear/worry.png',       1),
  (@botBear,    'TEARS',       '눈물',       'EMOTION', '/images/mascots/bear/tears.png',       1),
  (@botBear,    'ANGER',       '화남',       'EMOTION', '/images/mascots/bear/anger.png',       1),
  (@botBear,    'CURIOSITY',   '호기심',     'EMOTION', '/images/mascots/bear/curiosity.png',   1),
  (@botBear,    'COMPLIMENTS', '칭찬',       'EMOTION', '/images/mascots/bear/compliments.png', 1),
  (@botBear,    'STRETCH',     '스트레칭',   'EMOTION', '/images/mascots/bear/stretch.png',     1),

  (@botCat,     'WORRY',       '걱정',       'EMOTION', '/images/mascots/cat/worry.png',       1),
  (@botCat,     'TEARS',       '눈물',       'EMOTION', '/images/mascots/cat/tears.png',       1),
  (@botCat,     'ANGER',       '화남',       'EMOTION', '/images/mascots/cat/anger.png',       1),
  (@botCat,     'CURIOSITY',   '호기심',     'EMOTION', '/images/mascots/cat/curiosity.png',   1),
  (@botCat,     'COMPLIMENTS', '칭찬',       'EMOTION', '/images/mascots/cat/compliments.png', 1),
  (@botCat,     'STRETCH',     '스트레칭',   'EMOTION', '/images/mascots/cat/stretch.png',     1),

  (@botHamster, 'WORRY',       '걱정',       'EMOTION', '/images/mascots/hamster/worry.png',       1),
  (@botHamster, 'TEARS',       '눈물',       'EMOTION', '/images/mascots/hamster/tears.png',       1),
  (@botHamster, 'ANGER',       '화남',       'EMOTION', '/images/mascots/hamster/anger.png',       1),
  (@botHamster, 'CURIOSITY',   '호기심',     'EMOTION', '/images/mascots/hamster/curiosity.png',   1),
  (@botHamster, 'COMPLIMENTS', '칭찬',       'EMOTION', '/images/mascots/hamster/compliments.png', 1),
  (@botHamster, 'STRETCH',     '스트레칭',   'EMOTION', '/images/mascots/hamster/stretch.png',     1);

-- 특수(스페셜) 모션: ginger (친밀도 2부터 열리도록)
INSERT INTO BOT_MOTION (bot_id, motion_code, motion_name, motion_group, asset_url, unlock_intimacy_level)
VALUES
  (@botDog,     'GINGER', '진저', 'SPECIAL', '/images/mascots/dog/ginger.png',     2),
  (@botBear,    'GINGER', '진저', 'SPECIAL', '/images/mascots/bear/ginger.png',    2),
  (@botCat,     'GINGER', '진저', 'SPECIAL', '/images/mascots/cat/ginger.png',     2),
  (@botHamster, 'GINGER', '진저', 'SPECIAL', '/images/mascots/hamster/ginger.png', 2);

