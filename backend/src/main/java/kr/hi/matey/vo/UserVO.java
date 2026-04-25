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
    private Timestamp lastLoginAt;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private LocalDateTime tokenExpiryDate;
    private String resetToken;
}
