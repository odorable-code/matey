package kr.hi.matey.vo;

import lombok.Data;

import java.sql.Timestamp;
import java.time.LocalDateTime;


@Data
public class UserVO {
    private long userId;
    private String email;
    private String password;
    private String nickname;
    private String userName;
    private Long birthDate;
    private Long gender;
    private String profile_image;
    private String login_type;
    private String status;
    private int termsAgreed;
    private int privacyAgreed;
    private int marketingAgreed;
    private Timestamp last_login_at;
    private Timestamp created_at;
    private Timestamp updated_at;
    private RoleVO role;
    // ROLE.role_code를 직접 매핑해서, 관리자 권한 체크가 끊기지 않게 한다.
    private String roleCode;
}
