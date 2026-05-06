package kr.hi.matey.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * 프로젝트 DB의 POST/COMMENT like_count와 맞추기 위한 사용자별 좋아요 기록 테이블.
 * (기존 REACTION 테이블은 target 식별 컬럼이 없어 사용하지 않음.)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CommunityLikeTablesInitializer implements InitializingBean {

    private final DataSource dataSource;

    @Override
    public void afterPropertiesSet() {
        String postLike = """
                CREATE TABLE IF NOT EXISTS `user_post_like` (
                  `user_id` BIGINT NOT NULL,
                  `post_id` BIGINT NOT NULL,
                  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`user_id`, `post_id`),
                  KEY `idx_upl_post` (`post_id`),
                  CONSTRAINT `fk_upl_user` FOREIGN KEY (`user_id`) REFERENCES `USER` (`user_id`) ON DELETE CASCADE,
                  CONSTRAINT `fk_upl_post` FOREIGN KEY (`post_id`) REFERENCES `POST` (`post_id`) ON DELETE CASCADE
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
            st.execute(postLike);
            st.execute(commentLike);
        } catch (Exception e) {
            log.warn("user_post_like / user_comment_like 테이블 생성에 실패했습니다. 좋아요 API는 해당 테이블이 필요합니다: {}", e.getMessage());
        }
    }
}
