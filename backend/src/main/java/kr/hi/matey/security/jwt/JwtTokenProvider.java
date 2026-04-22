package kr.hi.matey.security.jwt;

import org.springframework.stereotype.Component;

import kr.hi.matey.util.CustomUser;
@Component
public class JwtTokenProvider {

    public String createAccessToken(CustomUser customUser) {
        return null;
    }

    public String createRefreshToken(CustomUser customUser) {
        return null;
    }

    public String createToken(String loginId, String role) {
        return loginId + ":" + role + ":" + System.currentTimeMillis();
    }
}