-- 기존 DB에 USER.assigned_bot_id 추가 (프로젝트 DB.sql 신규 설치에는 포함됨)
-- BOT 테이블 생성 이후에 실행하세요.

ALTER TABLE `USER`
  ADD COLUMN `assigned_bot_id` BIGINT NULL
    COMMENT '사용자가 지정한 담당 상담봇 (미지정 시 EXCLUSIVE 등으로 추론)'
    AFTER `updated_at`;

ALTER TABLE `USER`
  ADD CONSTRAINT `fk_user_assigned_bot`
  FOREIGN KEY (`assigned_bot_id`) REFERENCES `BOT` (`bot_id`);
