package kr.hi.matey.config;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * 로컬에서 DB에 넣은 BCrypt 문자열이 어긋나 로그인이 막힐 때, 기동 시점에 테스트 계정만
 * "비밀번호 = 이메일" 규칙으로 맞춥니다. 운영 배포 시 {@code matey.sync-test-user-passwords=false}.
 */
@Slf4j
@Component
@Order(1)
public class SeedTestUserPasswordRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final boolean syncEnabled;
    private final List<String> syncEmails;

    public SeedTestUserPasswordRunner(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            @Value("${matey.sync-test-user-passwords:false}") boolean syncEnabled,
            @Value("${matey.sync-test-user-emails:}") String syncEmailsCsv) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.syncEnabled = syncEnabled;
        this.syncEmails = Arrays.stream(syncEmailsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!syncEnabled) {
            return;
        }
        if (syncEmails.isEmpty()) {
            return;
        }
        for (String email : syncEmails) {
            String encoded = passwordEncoder.encode(email);
            int updated = jdbcTemplate.update(
                    "UPDATE `USER` SET password = ? WHERE email = ?",
                    encoded,
                    email);
            if (updated == 0) {
                log.warn("matey.sync-test-user-passwords: no row for email={}", email);
            } else {
                log.info("matey.sync-test-user-passwords: updated password for email={}", email);
            }
        }
    }
}
