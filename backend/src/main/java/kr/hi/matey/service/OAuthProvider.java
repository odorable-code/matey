package kr.hi.matey.service;

import kr.hi.matey.dto.OAuthUserInfo;

public interface OAuthProvider {
    String providerName();
    String buildAuthorizeUrl(String state);
    OAuthUserInfo getUserInfo(String code, String state);
}