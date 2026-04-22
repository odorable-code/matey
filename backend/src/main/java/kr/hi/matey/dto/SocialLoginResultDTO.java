package kr.hi.matey.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SocialLoginResultDTO {
    private Long memberId;
    private String loginId;
    private String role;
    private boolean isNewUser;
}