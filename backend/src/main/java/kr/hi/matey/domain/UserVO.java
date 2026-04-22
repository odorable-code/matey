package kr.hi.matey.domain;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;


@Data
public class UserVO {
    private Long userId;
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
}
