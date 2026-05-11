-- USER_BOT_RECOMMEND: 사용자별 봇 반응 (1=추천/좋아요, 0=싫어요). 한 사용자·봇당 한 번만 기록되며 변경·취소 없음(운영 리셋 등 별도).
ALTER TABLE USER_BOT_RECOMMEND
    ADD COLUMN reaction TINYINT NOT NULL DEFAULT 1 COMMENT '1=좋아요,0=싫어요' AFTER bot_id;
