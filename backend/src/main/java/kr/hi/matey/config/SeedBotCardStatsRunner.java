package kr.hi.matey.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * 메인 홈 카드는 {@code BOT.card_stats_json} 만 쓰므로, 컬럼은 있는데 값이 비어 있으면
 * 기본 세 마리(dog/bear/cat)에만 JSON을 채워 넣습니다. 이미 값이 있으면 건드리지 않습니다.
 * <p>
 * 운영에서 DB만 수동 관리할 경우 {@code matey.seed-bot-card-stats=false}.
 */
@Slf4j
@Component
@Order(2)
public class SeedBotCardStatsRunner implements ApplicationRunner {

    private static final Map<String, String> DEFAULT_JSON_BY_BOT_NAME = new LinkedHashMap<>();

    static {
        DEFAULT_JSON_BY_BOT_NAME.put(
                "dog",
                "[{\"label\":\"공감력\",\"value\":92},{\"label\":\"친근함\",\"value\":95},{\"label\":\"시작 편안함\",\"value\":90},{\"label\":\"부드러움\",\"value\":88}]");
        DEFAULT_JSON_BY_BOT_NAME.put(
                "bear",
                "[{\"label\":\"공감력\",\"value\":84},{\"label\":\"친근함\",\"value\":78},{\"label\":\"분석력\",\"value\":91},{\"label\":\"정리력\",\"value\":94}]");
        DEFAULT_JSON_BY_BOT_NAME.put(
                "cat",
                "[{\"label\":\"공감력\",\"value\":76},{\"label\":\"친근함\",\"value\":72},{\"label\":\"분석력\",\"value\":96},{\"label\":\"명확함\",\"value\":93}]");
    }

    private final JdbcTemplate jdbcTemplate;
    private final boolean seedEnabled;

    public SeedBotCardStatsRunner(
            JdbcTemplate jdbcTemplate,
            @Value("${matey.seed-bot-card-stats:true}") boolean seedEnabled) {
        this.jdbcTemplate = jdbcTemplate;
        this.seedEnabled = seedEnabled;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedEnabled) {
            return;
        }
        if (!hasCardStatsColumn()) {
            log.warn(
                    "matey.seed-bot-card-stats: BOT.card_stats_json 컬럼이 없어 건너뜁니다. "
                            + "프로젝트 DB.sql 의 ALTER 후 재기동하세요.");
            return;
        }
        int total = 0;
        for (Map.Entry<String, String> e : DEFAULT_JSON_BY_BOT_NAME.entrySet()) {
            try {
                int n =
                        jdbcTemplate.update(
                                "UPDATE BOT SET card_stats_json = ? "
                                        + "WHERE name = ? AND (card_stats_json IS NULL OR TRIM(card_stats_json) = '')",
                                e.getValue(),
                                e.getKey());
                total += n;
            } catch (DataAccessException ex) {
                log.warn("matey.seed-bot-card-stats: UPDATE 실패 name={} — {}", e.getKey(), ex.getMessage());
            }
        }
        if (total > 0) {
            log.info("matey.seed-bot-card-stats: 비어 있던 BOT.card_stats_json {}건을 기본값으로 채웠습니다.", total);
        }
    }

    private boolean hasCardStatsColumn() {
        try {
            Integer cnt =
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                                    + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'BOT' AND COLUMN_NAME = 'card_stats_json'",
                            Integer.class);
            return cnt != null && cnt > 0;
        } catch (DataAccessException ex) {
            return false;
        }
    }
}
