package kr.hi.matey.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * 프로젝트 DB의 POST/COMMENT like_count와 맞추기 위한 사용자별 좋아요 기록 테이블,
 * POST dislike_count와 맞추기 위한 사용자별 반응 상태 테이블.
 *
 * state:
 * - 1: 좋아요
 * - 0: 싫어요
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CommunityLikeTablesInitializer implements InitializingBean {

    private final DataSource dataSource;

    @Override
    public void afterPropertiesSet() {
        String postReaction = """
                CREATE TABLE IF NOT EXISTS `user_post_reaction` (
                  `user_id` BIGINT NOT NULL,
                  `post_id` BIGINT NOT NULL,
                  `state` TINYINT NOT NULL,
                  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`user_id`, `post_id`),
                  KEY `idx_upr_post` (`post_id`),
                  CONSTRAINT `fk_upr_user` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`) ON DELETE CASCADE,
                  CONSTRAINT `fk_upr_post` FOREIGN KEY (`post_id`) REFERENCES `POST` (`post_id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """;
        String commentLike = """
                CREATE TABLE IF NOT EXISTS `user_comment_like` (
                  `user_id` BIGINT NOT NULL,
                  `comment_id` BIGINT NOT NULL,
                  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`user_id`, `comment_id`),
                  KEY `idx_ucl_comment` (`comment_id`),
                  CONSTRAINT `fk_ucl_user` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`) ON DELETE CASCADE,
                  CONSTRAINT `fk_ucl_comment` FOREIGN KEY (`comment_id`) REFERENCES `COMMENT` (`comment_id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
                """;
        try (Connection conn = dataSource.getConnection(); Statement st = conn.createStatement()) {
            st.execute(postReaction);
            st.execute(commentLike);
        } catch (Exception e) {
            log.warn("커뮤니티 반응 테이블 생성에 실패했습니다: {}", e.getMessage());
        }
    }
}
