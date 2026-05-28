package kr.hi.matey.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OAuthUserInfo {
    private String provider;
    private String providerUserId;
    private String email;
    private String nickname;
    private String profileImage;
    private String birthdate;  // "YYYY-MM-DD", nullable
    private String gender;     // "M" or "F", nullable
}