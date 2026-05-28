package kr.hi.matey.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocialSignupRequestDTO {
    private String userEmail;
    private String userName;
    private Long userBirth;
    private Long gender;
    private Boolean isAdult;
    private Boolean isNotiAgree;
    private int isTermsAgreed;
    private int isPrivacyAgreed;
    private int isMarketingAgreed;
}