package kr.hi.matey.vo;

import lombok.Data;

import java.sql.Date;
import java.sql.Timestamp;


@Data
public class UserVO {
    private long userId;
    private String email;
    private String password;
    private String nickname;
    private String userName;
    private Long birthDate;
    /** DB USER.gender — VARCHAR(10), 예: MALE, FEMALE */
    private String gender;
    /** 소셜 가입 INSERT 전용 — DB USER.birth_date (DATE) */
    private Date birthDateSql;
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
    /** USER_ROLE.role_id — ADMIN_FAQ 등 FK 컬럼 채우기용 */
    private Long roleId;
}
