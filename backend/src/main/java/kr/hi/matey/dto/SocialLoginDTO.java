package kr.hi.matey.dto;

import java.sql.Timestamp;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocialLoginDTO {

    private Long socialId;
    private String provider;
    private String providerUserId;
    private String socialAccessToken;
    private String socialRefreshToken;
    private Timestamp connectedAt;
    private Long userId;
}