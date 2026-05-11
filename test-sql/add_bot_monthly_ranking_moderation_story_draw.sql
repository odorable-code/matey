-- ============================================================
-- 봇 월간 추천 집계(BOT_RECOMMEND_EVENT), 댓글 금칙어, 차단 로그, 사연 추첨용 참고
-- 실행 후 기존 추천 내역은 이벤트가 없으므로 전월 랭킹은 신규 추천부터 반영됩니다.
-- ============================================================

CREATE TABLE IF NOT EXISTS `BOT_RECOMMEND_EVENT` (
  `event_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `bot_id` BIGINT NOT NULL,
  `delta` TINYINT NOT NULL COMMENT '1: 추천, -1: 추천 취소',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_bre_bot_time` (`bot_id`, `created_at`),
  KEY `idx_bre_time` (`created_at`),
  CONSTRAINT `fk_bre_user` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bre_bot` FOREIGN KEY (`bot_id`) REFERENCES `BOT` (`bot_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `COMMUNITY_MODERATION_KEYWORD` (
  `keyword_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `phrase` VARCHAR(200) NOT NULL,
  `enabled` TINYINT NOT NULL DEFAULT 1,
  `hit_count` BIGINT NOT NULL DEFAULT 0 COMMENT '차단 시 증가 (관리·학습 참고)',
  `source` VARCHAR(20) NOT NULL DEFAULT 'admin' COMMENT 'admin | seed | learned',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_moderation_phrase` (`phrase`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `COMMENT_MODERATION_BLOCK_LOG` (
  `log_id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `post_id` BIGINT NOT NULL,
  `matched_phrase` VARCHAR(200) NULL,
  `content_snippet` VARCHAR(200) NOT NULL COMMENT '원문 앞부분(학습·검토용)',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cmb_post` (`post_id`),
  KEY `idx_cmb_created` (`created_at`),
  CONSTRAINT `fk_cmb_user` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cmb_post` FOREIGN KEY (`post_id`) REFERENCES `POST` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
