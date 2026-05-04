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
	`login_type` ENUM('LOCAL', 'KAKAO', 'GOOGLE', 'NAVER')	NOT NULL DEFAULT 'LOCAL',
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
	`target_type`	ENUM('POST', 'COMMENT', 'NULL')	NULL	DEFAULT NULL,
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
	`message_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`emotion_id`	BIGINT	NOT NULL,
	`chat_room_id`	BIGINT	NOT NULL,
	`risk_level`	INT	NOT NULL,
	`content`	TEXT	NOT NULL,
	`sender_type`	VARCHAR(10)	NULL,
	`keyword`	VARCHAR(100)	NOT NULL,
	`date`	DATE	NOT NULL,
    
	FOREIGN KEY(`emotion_id`) REFERENCES `EMOTION_CATEGORY`(`emotion_id`),
    FOREIGN KEY(`chat_room_id`) REFERENCES `CHAT_ROOM`(`chat_room_id`),
    FOREIGN KEY(`risk_level`) REFERENCES `RISK_LEVEL`(`risk_level`)
);

CREATE TABLE `NOTIFICATION` (
	`notification_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`type_code`	VARCHAR(50)	NOT NULL,
	`content`	VARCHAR(255)	NULL,
	`is_read`	TINYINT	NOT NULL	DEFAULT 0,
	`created_at`	TIMESTAMP	NULL	DEFAULT CURRENT_TIMESTAMP,
	`target_type`	VARCHAR(50)	NULL,
	`target_id`	BIGINT	NULL,
    
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
	`emotion_id`	BIGINT	NOT NULL,
	`confidence`	DECIMAL(6,4)	NOT NULL,
	`date`	DATE	NULL,
	`total_count`	INT	NOT NULL	DEFAULT 0,
	`count`	INT	NOT NULL	DEFAULT 0,
    
    FOREIGN KEY(`emotion_id`) REFERENCES `EMOTION_CATEGORY`(`emotion_id`)
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
	`user_role_id`	BIGINT	NOT NULL PRIMARY KEY AUTO_INCREMENT,
	`user_id`	BIGINT	NOT NULL,
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
