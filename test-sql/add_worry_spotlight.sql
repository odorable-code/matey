-- 관리자가 고민 글을 지정·답변하면 커뮤니티에 크게 노출 (단일 스포트라이트)
CREATE TABLE IF NOT EXISTS `WORRY_SPOTLIGHT` (
  `id` TINYINT NOT NULL DEFAULT 1 PRIMARY KEY,
  `post_id` BIGINT NOT NULL,
  `answer_content` TEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by_user_id` BIGINT NULL,
  CONSTRAINT `fk_worry_spotlight_post` FOREIGN KEY (`post_id`) REFERENCES `POST`(`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_worry_spotlight_user` FOREIGN KEY (`updated_by_user_id`) REFERENCES `USER`(`user_id`) ON DELETE SET NULL
);
