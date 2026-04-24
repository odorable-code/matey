package kr.hi.matey.vo;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.LocalDateTime;


@Data
public class UserVO {
    private BigInteger userId;
    private String email;
    private String password;
    private String nickname;
    private String userName;
    private Long userBirth;
    private Long gender;
    private String profileImage;
    private String role;
    private String loginType;
    private String status;
    private Integer point;
    private String subscriptionGrade;
    private Boolean isAdult;
    private Boolean isNotiAgree;
    private Boolean isTermsAgreed;
    private Boolean isPrivacyAgreed;
    private Boolean isMarketingAgreed;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
