package kr.hi.matey.vo;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserVO {
    private Long id;
    private String loginId;
    private String password;
    private String name;
    private String email;
    private String role;

    private String provider;
    private String providerUserId;
    private String profileImage;
}