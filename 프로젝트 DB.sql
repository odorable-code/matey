DROP DATABASE matey;
CREATE DATABASE matey;
USE matey;
DROP USER 'team-- user'@'%';
CREATE USER 'team-- user'@'%' IDENTIFIED BY '1234';

GRANT SELECT, INSERT, UPDATE, DELETE ON MATEY.* TO 'team-- user'@'%';

FLUSH PRIVILEGES;

CREATE TABLE `USER` (
	`user_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`email`	VARCHAR(100)	NOT NULL	UNIQUE,
	`password`	VARCHAR(255)	NULL,
	`nickname`	VARCHAR(30)	NOT NULL	UNIQUE,
	`user_name`	VARCHAR(30)	NULL,
	`birth_date`	DATE	NULL,
	`gender`	VARCHAR(10)	NULL,
	`profile_image`	VARCHAR(500)	NULL,
	`login_type` ENUM('LOCAL', 'KAKAO', 'NAVER')	NOT NULL DEFAULT 'LOCAL',
    `status` ENUM('ACTIVE', 'BANNED', 'DELETED')	NOT NULL DEFAULT 'ACTIVE',
	`is_terms_agreed`	BOOLEAN	NOT NULL	DEFAULT FALSE,
	`is_privacy_agreed`	BOOLEAN	NOT NULL	DEFAULT FALSE,
	`is_marketing_agreed`	BOOLEAN	NOT NULL	DEFAULT FALSE,
	`last_login_at`	TIMESTAMP	NULL	DEFAULT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`assigned_bot_id`	BIGINT	NULL	COMMENT '사용자가 지정한 담당 상담봇 (미지정 시 EXCLUSIVE 등으로 추론)'
);

CREATE TABLE `BOT` (
	`bot_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`name`	VARCHAR(50)	NOT NULL,
	`avatar_image`	VARCHAR(500)	NULL	DEFAULT NULL,
	`description`	TEXT	NULL	DEFAULT NULL,
	`selection_preview`	TEXT	NOT NULL,
	`like_count`	INT	NOT NULL	DEFAULT 0,
	`dislike_count`	INT	NOT NULL	DEFAULT 0,
	`reset_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE `USER`
	ADD CONSTRAINT `fk_user_assigned_bot`
	FOREIGN KEY (`assigned_bot_id`) REFERENCES `BOT`(`bot_id`);

CREATE TABLE `EMOTION_CATEGORY` (
	`emotion_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`emotion_code`	VARCHAR(20)	NOT NULL	UNIQUE,
	`emotion_name`	VARCHAR(50)	NOT NULL
);

CREATE TABLE `NOTIFICATION_TYPE` (
	`type_code`	VARCHAR(50)	NOT NULL PRIMARY KEY UNIQUE,
	`type_name`	VARCHAR(100)	NOT NULL,
	`description`	VARCHAR(255)	NOT NULL
);

CREATE TABLE `BOT_LETTER_TYPE` (
	`letter_type_id`	BIGINT	NOT NULL PRIMARY KEY,
	`name`	VARCHAR(10)	NOT NULL,
	`template`	TEXT	NOT NULL
);

CREATE TABLE `CATEGORY` (
	`category_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`name`	VARCHAR(50)	NOT NULL,
	`notification`	TINYINT	NOT NULL	DEFAULT 1
);

CREATE TABLE `RISK_LEVEL` (
	`risk_level`	INT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`action`	TEXT	NOT NULL
);

CREATE TABLE `ROLE` (
	`role_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`role_code`	VARCHAR(30)	NOT NULL	COMMENT 'UNIQUE',
	`role_name`	VARCHAR(50)	NOT NULL,
	`description`	VARCHAR(255)	NOT NULL
);

CREATE TABLE `CHAT_BACKGROUND` (
	`background_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`name`	VARCHAR(100)	NOT NULL,
	`image_url`	VARCHAR(500)	NOT NULL,
	`unlock_intimacy_level`	INT	NOT NULL	DEFAULT 0,
	`sort_order`	INT	NOT NULL	DEFAULT 0
);

CREATE TABLE `BOT_POPULARITY_STAT` (
	`stat_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`bot_id`	BIGINT	NOT NULL,
	`stat_year`	INT	NOT NULL,
	`stat_month`	TINYINT	NOT NULL	DEFAULT 0,
	`popularity_score`	DECIMAL(10,2)	NOT NULL	DEFAULT 0.00,
	`ranking`	INT	NULL	DEFAULT NULL,
    
    FOREIGN KEY(`bot_id`) REFERENCES `BOT`(`bot_id`)
);

CREATE TABLE `EXCLUSIVE` (
	`exclusive_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`bot_id`	BIGINT	NOT NULL,
    
    UNIQUE KEY `uq_user_bot` (`user_id`, `bot_id`),
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`),
    FOREIGN KEY(`bot_id`) REFERENCES `BOT`(`bot_id`)
);

CREATE TABLE `SUPPORT_REASON` (
	`support_reason_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`reason_type` ENUM('REPORT', 'INQUIRY') NOT NULL,
	`target_type` ENUM('POST', 'COMMENT') NULL DEFAULT NULL,
	`reason_code`	VARCHAR(10)	NULL,
	`reason_name`	ENUM('욕설/비방', '성적/음란 콘텐츠', '광고/스팸', '혐오 표현', '사기/허위 정보', '개인정보 노출', '불법 콘텐츠', '도배/반복 게시', '결제문의', '계정문의', '버그/오류문의', '서비스 이용 문의', '콘텐츠 관련 문의', '기타')	NOT NULL,
	`is_active`	TINYINT	NOT NULL	DEFAULT 1
);

CREATE TABLE `SUPPORT` (
	`support_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`support_reason_id`	BIGINT	NOT NULL,
	`user_id`	BIGINT	NOT NULL,
	`title`	VARCHAR(200)	NOT NULL,
	`content`	TEXT	NOT NULL,
    `status` ENUM('PENDING', 'DONE')	NOT NULL DEFAULT 'PENDING',
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NULL	DEFAULT CURRENT_TIMESTAMP,
    
	FOREIGN KEY(`support_reason_id`) REFERENCES `SUPPORT_REASON`(`support_reason_id`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `CHAT_ROOM` (
	`chat_room_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`background_id`	BIGINT	NOT NULL,
	`exclusive_id`	BIGINT	NOT NULL,
	`title`	VARCHAR(100)	NULL,
	`status` ENUM('ACTIVE', 'ARCHIVED', 'DELETED')	NOT NULL DEFAULT 'ACTIVE',
	`last_message`	TEXT	NOT NULL,
	`last_message_at`	TIMESTAMP	NULL	DEFAULT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`background_id`) REFERENCES `CHAT_BACKGROUND`(`background_id`),
    FOREIGN KEY(`exclusive_id`) REFERENCES `EXCLUSIVE`(`exclusive_id`)
);

CREATE TABLE `MESSAGE` (
	`message_id`    BIGINT      NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`emotion_id`    BIGINT      NULL,
	`chat_room_id`  BIGINT      NOT NULL,
	`risk_level`    INT         NULL,
	`content`       TEXT        NOT NULL,
	`sender_type`   VARCHAR(10) NULL,
	`keyword`       VARCHAR(100) NULL,
	`summary`       TEXT        NULL COMMENT '해당 메시지 기준 상담/감정 요약',
	`created_at`    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
	FOREIGN KEY(`emotion_id`) REFERENCES `EMOTION_CATEGORY`(`emotion_id`),
    FOREIGN KEY(`chat_room_id`) REFERENCES `CHAT_ROOM`(`chat_room_id`),
    FOREIGN KEY(`risk_level`) REFERENCES `RISK_LEVEL`(`risk_level`)
);

CREATE TABLE `NOTIFICATION` (
	`notification_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id` BIGINT NOT NULL,
	`type_code`	VARCHAR(50)	NOT NULL,
	`content`	VARCHAR(255)	NULL,
	`is_read`	TINYINT	NOT NULL	DEFAULT 0,
	`created_at`	TIMESTAMP	NULL	DEFAULT CURRENT_TIMESTAMP,
	`target_type`	VARCHAR(50)	NULL,
	`target_id`	BIGINT	NULL,
    
    FOREIGN KEY (user_id) REFERENCES USER(user_id),
    FOREIGN KEY(`type_code`) REFERENCES `NOTIFICATION_TYPE`(`type_code`)
);

CREATE TABLE `SUPPORT_ANSWER` (
	`answer_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`admin_user_id`	BIGINT	NOT NULL,
	`support_id`	BIGINT	NOT NULL,
	`content`	TEXT	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`admin_user_id`) REFERENCES `USER`(`user_id`),
    FOREIGN KEY(`support_id`) REFERENCES `SUPPORT`(`support_id`)
);

CREATE TABLE `EMOTION_SCORE` (
	`score_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`emotion_id`	BIGINT	NOT NULL,
	`confidence`	DECIMAL(6,4)	NOT NULL,
	`date`	DATE	NULL,
	`total_count`	INT	NOT NULL	DEFAULT 0,
	`count`	INT	NOT NULL	DEFAULT 0,
    
    FOREIGN KEY(`emotion_id`) REFERENCES `EMOTION_CATEGORY`(`emotion_id`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `BOT_LETTER` (
	`letter_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`letter_type_id`	BIGINT	NOT NULL,
	`exclusive_id`	BIGINT	NOT NULL,
	`title`	VARCHAR(200)	NOT NULL,
	`content`	TEXT	NOT NULL,
	`is_read`	BOOLEAN	NOT NULL	DEFAULT FALSE,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`read_at`	TIMESTAMP	NULL	DEFAULT NULL,
    
    FOREIGN KEY(`letter_type_id`) REFERENCES `BOT_LETTER_TYPE`(`letter_type_id`),
    FOREIGN KEY(`exclusive_id`) REFERENCES `EXCLUSIVE`(`exclusive_id`)
);

CREATE TABLE `USER_SETTING` (
	`setting_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`satisfaction_popup_enabled`	BOOLEAN	NOT NULL	DEFAULT TRUE,
	`satisfaction_popup_snoozed_until`	TIMESTAMP	NULL	DEFAULT NULL,
	`bot_letter_enabled`	BOOLEAN	NOT NULL	DEFAULT TRUE,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `SATISFACTION` (
	`satisfaction_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`exclusive_id`	BIGINT	NOT NULL,
	`chat_room_id`	BIGINT	NOT NULL,
	`rating`	INT	NOT NULL,
	`feedback`	TEXT	NULL	DEFAULT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`exclusive_id`) REFERENCES `EXCLUSIVE`(`exclusive_id`),
    FOREIGN KEY(`chat_room_id`) REFERENCES `CHAT_ROOM`(`chat_room_id`)
);

CREATE TABLE `PASSWORD_RESET_TOKEN` (
	`reset_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`token_hash`	VARCHAR(255)	NOT NULL,
	`used_at`	TIMESTAMP	NULL	DEFAULT NULL,
	`expires_at`	TIMESTAMP	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `USER_ROLE` (
	`user_id`	BIGINT	NOT NULL PRIMARY KEY,
	`role_id`	BIGINT	NOT NULL	DEFAULT 1,
    
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`),
    FOREIGN KEY(`role_id`) REFERENCES `ROLE`(`role_id`)
);

CREATE TABLE `BOT_MOTION` (
	`motion_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`bot_id`	BIGINT	NOT NULL,
	`motion_code`	VARCHAR(50)	NOT NULL,
	`motion_name`	VARCHAR(100)	NOT NULL,
	`motion_group`	VARCHAR(30)	NOT NULL,
	`asset_url`	VARCHAR(500)	NOT NULL,
	`unlock_intimacy_level`	INT	NOT NULL	DEFAULT 0,
    
    FOREIGN KEY(`bot_id`) REFERENCES `BOT`(`bot_id`)
);

CREATE TABLE `COUNSEL_SUMMARY` (
	`counsel_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`chat_room_id`	BIGINT	NOT NULL,
	`start_message_id`	BIGINT	NOT NULL,
	`end_message_id`	BIGINT	NOT NULL,
	`content`	JSON	NOT NULL,
	`trigger_type`	ENUM('EMOTION_SHIFT', 'RISK_UP', 'NEW_KEYWORD')	NULL,
    
    FOREIGN KEY(`chat_room_id`) REFERENCES `CHAT_ROOM`(`chat_room_id`),
    FOREIGN KEY(`start_message_id`) REFERENCES `MESSAGE`(`message_id`),
    FOREIGN KEY(`end_message_id`) REFERENCES `MESSAGE`(`message_id`)
);

CREATE TABLE `AUTO_LOGIN` (
	`auto_login_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`token_hash`	VARCHAR(255)	NOT NULL,
	`device_info`	VARCHAR(500)	NULL	DEFAULT NULL,
	`last_used_at`	TIMESTAMP	NULL	DEFAULT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`expired_at`	TIMESTAMP	NOT NULL,
    
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `POST` (
	`post_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`category_id`	BIGINT	NOT NULL,
	`user_id`	BIGINT	NOT NULL,
	`title`	VARCHAR(200)	NOT NULL,
	`content`	TEXT	NOT NULL,
	`like_count`	INT	NOT NULL	DEFAULT 0,
	`dislike_count`	INT	NOT NULL	DEFAULT 0,
	`report_count`	INT	NOT NULL	DEFAULT 0,
	`view_count`	INT	NOT NULL	DEFAULT 0,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`category_id`) REFERENCES `CATEGORY`(`category_id`),
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `INTIMACY_LEVEL` (
	`intimacy_id`	int	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`level_description`	text	NULL,
	`intimacy_standard`	int	NULL
);

CREATE TABLE `USER_INVENTORY` (
	`inventory_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL	UNIQUE,
	`universal_feed_count`	INT	NOT NULL	DEFAULT 0,
    
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `POST_IMAGE` (
	`post_image_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`post_id`	BIGINT	NOT NULL,
	`image_url`	VARCHAR(500)	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`name`	VARCHAR(100)	NOT NULL,
    
    FOREIGN KEY(`post_id`) REFERENCES `POST`(`post_id`)
);

CREATE TABLE `COMMENT` (
	`comment_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`post_id`	BIGINT	NOT NULL,
	`user_id`	BIGINT	NOT NULL,
	`parent_comment_id`	BIGINT	NULL	DEFAULT NULL,
	`content`	TEXT	NOT NULL,
	`like_count`	INT	NOT NULL	DEFAULT 0,
	`report_count`	INT	NOT NULL	DEFAULT 0,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`post_id`) REFERENCES `POST`(`post_id`),
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`),
    FOREIGN KEY(`parent_comment_id`) REFERENCES `COMMENT`(`comment_id`)
);

CREATE TABLE `USER_BOT_RELATION` (
	`relation_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`exclusive_id`	BIGINT	NOT NULL,
	`intimacy_id`	int	NOT NULL,
	`last_fed_at`	TIMESTAMP	NULL	DEFAULT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`current_exp`	INT	NOT NULL,
    
    FOREIGN KEY(`exclusive_id`) REFERENCES `EXCLUSIVE`(`exclusive_id`),
    FOREIGN KEY(`intimacy_id`) REFERENCES `INTIMACY_LEVEL`(`intimacy_id`)
);

CREATE TABLE `USER_BOT_RECOMMEND` (
	`recommend_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`bot_id`	BIGINT	NOT NULL,
	`reaction`	TINYINT	NOT NULL	DEFAULT 1	COMMENT '1=좋아요,0=싫어요',
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,

	UNIQUE KEY `uq_user_bot_recommend` (`user_id`, `bot_id`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`),
	FOREIGN KEY(`bot_id`) REFERENCES `BOT`(`bot_id`)
);

CREATE TABLE `ADMIN_FAQ` (
	`faq_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`role_id`	BIGINT	NOT NULL,
	`question`	VARCHAR(300)	NOT NULL,
	`answer`	TEXT	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY(`role_id`) REFERENCES `ROLE`(`role_id`)
);

CREATE TABLE `USER_NOTIFICATION_SETTING` (
	`setting_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`type_code`	VARCHAR(50)	NOT NULL,
	`is_enabled`	TINYINT	NOT NULL	DEFAULT 1,
    
    UNIQUE KEY `uq_user_type` (`user_id`, `type_code`),
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`),
    FOREIGN KEY(`type_code`) REFERENCES `NOTIFICATION_TYPE`(`type_code`)
);

-- ==================================================
-- 커뮤니티 반응(좋아요/싫어요) 사용자 상태 테이블 (0/1)
-- - state: 1(좋아요), 0(싫어요)
-- - 행이 없으면 "반응 없음"
-- ==================================================

CREATE TABLE `user_post_reaction` (
	`user_id`	BIGINT	NOT NULL,
	`post_id`	BIGINT	NOT NULL,
	`state`	TINYINT	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
	PRIMARY KEY (`user_id`, `post_id`),
	KEY `idx_upr_post` (`post_id`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE,
	FOREIGN KEY(`post_id`) REFERENCES `POST`(`post_id`) ON DELETE CASCADE
);

-- 관리자 고민 스포트라이트(운영 답변과 함께 커뮤니티 상단 노출, 단일 행 id=1)
CREATE TABLE `WORRY_SPOTLIGHT` (
	`id`	TINYINT	NOT NULL DEFAULT 1 PRIMARY KEY,
	`post_id`	BIGINT	NOT NULL,
	`answer_content`	TEXT	NOT NULL,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updated_by_user_id`	BIGINT	NULL,
	FOREIGN KEY(`post_id`) REFERENCES `POST`(`post_id`) ON DELETE CASCADE,
	FOREIGN KEY(`updated_by_user_id`) REFERENCES `USER`(`user_id`) ON DELETE SET NULL
);

-- 댓글은 좋아요만 사용(별도 테이블)
CREATE TABLE `user_comment_like` (
	`user_id`	BIGINT	NOT NULL,
	`comment_id`	BIGINT	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
	PRIMARY KEY (`user_id`, `comment_id`),
	KEY `idx_ucl_comment` (`comment_id`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE,
	FOREIGN KEY(`comment_id`) REFERENCES `COMMENT`(`comment_id`) ON DELETE CASCADE
);

-- ==================================================
-- 커뮤니티 키워드 필터(운영/관리자 설정)
-- ==================================================
CREATE TABLE `COMMUNITY_MODERATION_KEYWORD` (
	`keyword_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`phrase`	VARCHAR(100)	NOT NULL,
	`enabled`	TINYINT	NOT NULL	DEFAULT 1,
	`hit_count`	INT	NOT NULL	DEFAULT 0,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================================================
-- 댓글/게시글 작성 시 필터에 걸린 로그(차단 사유 확인용)
-- ==================================================
CREATE TABLE `COMMENT_MODERATION_BLOCK_LOG` (
	`log_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`post_id`	BIGINT	NOT NULL,
	`matched_phrase`	VARCHAR(100)	NOT NULL,
	`content_snippet`	VARCHAR(255)	NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,

	KEY `idx_cmbl_user` (`user_id`),
	KEY `idx_cmbl_post` (`post_id`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE,
	FOREIGN KEY(`post_id`) REFERENCES `POST`(`post_id`) ON DELETE CASCADE
);

CREATE TABLE `REACTION` (
	`reaction_id`	BIGINT	NOT NULL PRIMARY KEY,
	`user_id`	BIGINT	NOT NULL,
	`target_type`	ENUM('POST', 'COMMENT')	NOT NULL,
	`state`	TINYINT	NULL,
    
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

CREATE TABLE `SOCIAL_LOGIN` (
	`social_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`provider`	VARCHAR(20)	NOT NULL,
	`provider_user_id`	VARCHAR(255)	NOT NULL,
	`connected_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY `uq_provider_user` (`provider`, `provider_user_id`),
    FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`)
);

-- ==================================================
-- 운영 공지 (관리자 작성, 게시/비게시 토글)
-- ==================================================
CREATE TABLE `ADMIN_NOTICE` (
	`notice_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`title`	VARCHAR(200)	NOT NULL,
	`content`	TEXT	NOT NULL,
	`is_published`	BOOLEAN	NOT NULL	DEFAULT FALSE,
	`published_at`	TIMESTAMP	NULL	DEFAULT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==================================================
-- 봇 추천/비추천 이벤트 로그 (월간 집계/랭킹용)
-- - delta: +1(좋아요), -1(싫어요)
-- ==================================================
CREATE TABLE `BOT_RECOMMEND_EVENT` (
	`event_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
	`bot_id`	BIGINT	NOT NULL,
	`delta`	TINYINT	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,

	KEY `idx_bre_bot_created` (`bot_id`, `created_at`),
	FOREIGN KEY(`user_id`) REFERENCES `USER`(`user_id`) ON DELETE CASCADE,
	FOREIGN KEY(`bot_id`) REFERENCES `BOT`(`bot_id`) ON DELETE CASCADE
);

-- ==================================================
-- 감정 리포트 분석 세션 / 분석 결과 저장용
-- ==================================================
CREATE TABLE `CHAT_ANALYSIS_SESSION` (
	`session_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`chat_room_id`	BIGINT	NOT NULL,
	`start_message_id`	BIGINT	NOT NULL,
	`end_message_id`	BIGINT	NOT NULL,
	`created_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,

	KEY `idx_cas_room` (`chat_room_id`),
	FOREIGN KEY(`chat_room_id`) REFERENCES `CHAT_ROOM`(`chat_room_id`) ON DELETE CASCADE,
	FOREIGN KEY(`start_message_id`) REFERENCES `MESSAGE`(`message_id`) ON DELETE CASCADE,
	FOREIGN KEY(`end_message_id`) REFERENCES `MESSAGE`(`message_id`) ON DELETE CASCADE
);

CREATE TABLE `MESSAGE_ANALYSIS` (
	`analysis_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`emotion_id`	BIGINT	NOT NULL,
	`session_id`	BIGINT	NOT NULL,
	`risk_level`	INT	NOT NULL,
	`analyzed_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP,

	KEY `idx_ma_session` (`session_id`),
	FOREIGN KEY(`emotion_id`) REFERENCES `EMOTION_CATEGORY`(`emotion_id`),
	FOREIGN KEY(`session_id`) REFERENCES `CHAT_ANALYSIS_SESSION`(`session_id`) ON DELETE CASCADE,
	FOREIGN KEY(`risk_level`) REFERENCES `RISK_LEVEL`(`risk_level`)
);

CREATE TABLE `RESPONSE_STRATEGY` (
	`risk_level`	INT	NOT NULL PRIMARY KEY,
	`name`	VARCHAR(100)	NOT NULL,
	`description`	TEXT	NULL,

	FOREIGN KEY(`risk_level`) REFERENCES `RISK_LEVEL`(`risk_level`) ON DELETE CASCADE
);

INSERT INTO ROLE (role_code, role_name, description) VALUES
('USER', '일반 사용자', '기본 사용자 권한'),
('SUBADMIN', '서브 관리자', '부분 관리자 권한'),
('ADMIN', '관리자', '전체 관리자 권한');

INSERT INTO NOTIFICATION_TYPE (type_code, type_name, description) VALUES
('SUPPORT_ANSWER', '신고/문의 답변', '신고 또는 문의글에 답변이 등록되었을 때'),
('POST_COMMENT', '게시글 댓글', '내 게시글에 댓글이 작성되었을 때'),
('COMMENT_REPLY', '대댓글', '내 댓글에 답글이 작성되었을 때'),
('BOT_MESSAGE', '봇 쪽지', '상담봇이 사용자에게 메시지를 보냈을 때'),
('SYSTEM_NOTICE', '시스템 공지', '운영 공지 및 시스템 알림'),
('POINT_REWARD', '포인트 지급', '포인트가 지급되었을 때'),
('COMMUNITY_HOT', '인기 게시글', '내 게시글이 인기글로 선정되었을 때'),
('REPORT_RESULT', '신고 처리 결과', '신고 처리 결과가 등록되었을 때'),
('CHAT_REMINDER', '상담 리마인드', '일정 시간 미접속 후 상담 유도 알림'),
('EVENT_NOTICE', '이벤트 알림', '이벤트 및 출석 보상 관련 알림');

INSERT INTO EMOTION_CATEGORY (emotion_code, emotion_name) VALUES
('HAPPY', '행복'), ('SAD', '슬픔'), ('ANGRY', '분노'), ('ANXIOUS', '불안'),
('LONELY', '외로움'), ('TIRED', '지침'), ('STRESSED', '스트레스'), ('DEPRESSED', '우울'),
('CONFUSED', '혼란'), ('CALM', '평온'), ('EXCITED', '설렘'), ('FEAR', '두려움'),
('HURT', '상처'), ('EMPTY', '공허함'), ('GRATEFUL', '감사'), ('NEUTRAL', '중립');

INSERT INTO CATEGORY (name, notification) VALUES
('공지', 0), ('일상', 1), ('고민상담', 1), ('연애', 1),
('우울/불안', 1), ('자유게시판', 1), ('질문', 1),
('후기', 1), ('정보공유', 1), ('이벤트', 0);

INSERT INTO SUPPORT_REASON (reason_type, target_type, reason_code, reason_name, is_active) VALUES
('REPORT', 'POST', 'ABUSE', '욕설/비방', 1), ('REPORT', 'POST', 'SEXUAL', '성적/음란 콘텐츠', 1),
('REPORT', 'POST', 'SPAM', '광고/스팸', 1), ('REPORT', 'POST', 'HATE', '혐오 표현', 1),
('REPORT', 'POST', 'SCAM', '사기/허위 정보', 1), ('REPORT', 'POST', 'PRIVACY', '개인정보 노출', 1),
('REPORT', 'POST', 'ILLEGAL', '불법 콘텐츠', 1), ('REPORT', 'POST', 'FLOOD', '도배/반복 게시', 1),

('REPORT', 'COMMENT', 'ABUSE', '욕설/비방', 1), ('REPORT', 'COMMENT', 'SEXUAL', '성적/음란 콘텐츠', 1),
('REPORT', 'COMMENT', 'SPAM', '광고/스팸', 1), ('REPORT', 'COMMENT', 'HATE', '혐오 표현', 1),
('REPORT', 'COMMENT', 'SCAM', '사기/허위 정보', 1), ('REPORT', 'COMMENT', 'PRIVACY', '개인정보 노출', 1),
('REPORT', 'COMMENT', 'ILLEGAL', '불법 콘텐츠', 1), ('REPORT', 'COMMENT', 'FLOOD', '도배/반복 게시', 1);

INSERT INTO SUPPORT_REASON (reason_type, target_type, reason_code, reason_name, is_active) VALUES
('INQUIRY', NULL, 'PAYMENT', '결제문의', 1), ('INQUIRY', NULL, 'ACCOUNT', '계정문의', 1), ('INQUIRY', NULL, 'BUG', '버그/오류문의', 1),
('INQUIRY', NULL, 'SERVICE', '서비스 이용 문의', 1), ('INQUIRY', NULL, 'CONTENT', '콘텐츠 관련 문의', 1), ('INQUIRY', NULL, 'ETC', '기타', 1);

INSERT INTO USER (email, password, nickname, user_name, birth_date, gender, profile_image, login_type, status,
    is_terms_agreed, is_privacy_agreed, is_marketing_agreed, last_login_at)
-- 아이디 비번 동일	
VALUES
('user1@test.com', '$2a$10$WuFXSHPrxLS4NzmQ2O18/ONxOvvh9yhmtWmVdmXDhZPAllz0ACm.2', '일반유저', '홍길동', '2000-01-01', 'MALE', NULL, 'LOCAL', 'ACTIVE', 
		TRUE, TRUE, FALSE, NOW()),
('subadmin1@test.com', '$2a$10$Mtw0DQKqQ4MyyGSRqSKApewy1vTm1GOZD8Z5BV317H6fIKa2iMUZu', '서브관리자', '김관리', '1995-05-05', 'FEMALE', NULL, 'LOCAL', 'ACTIVE', 
		TRUE, TRUE, FALSE, NOW()),
('admin1@test.com', '$2a$10$VZNiB5ikzDaBMaylOAJEuuipYqCCPWi3YI0hEGe0DgwG6ysGq8mAi', '총관리자', '이관리', '1990-10-10', 'MALE', NULL, 'LOCAL', 'ACTIVE', 
		TRUE, TRUE, FALSE, NOW());

INSERT INTO USER_ROLE (user_id, role_id)
VALUES (1, 1), (2, 2), (3, 3);

-- ==================================================
-- BOT / BOT_MOTION 시드
-- - 프론트 에셋(frontend/public/images/mascots/*) 기준으로 BOT_MOTION을 채웁니다.
-- - BOT.name 은 코드에서 botKey 로 쓰이므로 dog/bear/cat/hamster 로 맞춥니다.
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

-- 1) BOT (설명/프리뷰 문구) — 메인/채팅 문구 톤에 맞춤
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

-- 2) BOT_MOTION
-- motion_group 규칙(프로젝트 MyPageMapper 기준):
-- - COMMON : 기본(항상 보유)
-- - EMOTION: 감정/상황 모션
-- - SPECIAL: 특수(친밀도에 따라 잠금 해제)

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
