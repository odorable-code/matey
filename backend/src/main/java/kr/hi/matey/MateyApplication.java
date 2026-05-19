package kr.hi.matey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootApplication
@EnableScheduling
public class MateyApplication {

    @Autowired
    private JdbcTemplate jdbcTemplate;

	public static void main(String[] args) {
		SpringApplication.run(MateyApplication.class, args);
	}

    @PostConstruct
    public void init() {
        try {
            jdbcTemplate.execute("ALTER TABLE USER MODIFY profile_image LONGTEXT;");
            System.out.println("========== SUCCESS: profile_image altered to LONGTEXT ==========");
            
            try {
                jdbcTemplate.execute("ALTER TABLE USER_SETTING ADD COLUMN casual_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE;");
                System.out.println("========== SUCCESS: casual_mode_enabled added to USER_SETTING ==========");
            } catch (Exception e) {
                System.out.println("========== INFO: casual_mode_enabled might already exist or could not be added ==========");
            }

            jdbcTemplate.execute("INSERT INTO USER_SETTING (user_id, bot_letter_enabled, satisfaction_popup_enabled, casual_mode_enabled) SELECT user_id, true, true, false FROM USER WHERE user_id NOT IN (SELECT user_id FROM USER_SETTING);");
            System.out.println("========== SUCCESS: Missing USER_SETTING rows created ==========");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
