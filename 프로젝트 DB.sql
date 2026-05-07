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
	`updated_at`	TIMESTAMP	NOT NULL	DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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