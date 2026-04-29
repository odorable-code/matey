package kr.hi.matey.dto;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private Long userId;
    private String email;
    private String password;
    private String nickname;
    private String userName;
    private Long birthDate;
    private Long gender;
    private String profileImage;
    private String role;
    private String loginType;
    private String status;

    // ===== 약관 동의 =====
    private boolean termsAgreed;
    private boolean privacyAgreed;
    private boolean marketingAgreed;

    // ===== 기타 =====
    private Timestamp last_login_at;
    private Timestamp created_at;
    private Timestamp updated_at;

    private LocalDateTime tokenExpiryDate;
    private String resetToken;

    @JsonProperty("rememberMe")
    private boolean rememberMe;
}