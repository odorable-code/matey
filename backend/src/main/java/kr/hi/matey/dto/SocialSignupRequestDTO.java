package kr.hi.matey.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocialSignupRequestDTO {
    private String userName;
    private Long userBirth;
    private Long gender;
    private Boolean isAdult;
    private Boolean isNotiAgree;
    private Boolean isTermsAgreed;
    private Boolean isPrivacyAgreed;
    private Boolean isMarketingAgreed;
}