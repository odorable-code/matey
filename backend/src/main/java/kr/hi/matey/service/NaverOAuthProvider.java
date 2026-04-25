package kr.hi.matey.service;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import kr.hi.matey.config.OAuthProperties;
import kr.hi.matey.dto.OAuthTokenResponse;
import kr.hi.matey.dto.OAuthUserInfo;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NaverOAuthProvider implements OAuthProvider {

    private final OAuthProperties oAuthProperties;
    private final WebClient webClient;

    @Override
    public String providerName() {
        return "naver";
    }

    @Override
    public String buildAuthorizeUrl(String state) {
        OAuthProperties.Provider p = oAuthProperties.getProviders().get("naver");

        return UriComponentsBuilder.fromUriString(p.getAuthorizeUri())
                .queryParam("response_type", "code")
                .queryParam("client_id", p.getClientId())
                .queryParam("redirect_uri", p.getRedirectUri())
                .queryParam("state", state)
                .build()
                .toUriString();
    }

    @Override
    @SuppressWarnings("unchecked")
    public OAuthUserInfo getUserInfo(String code, String state) {
        OAuthProperties.Provider p = oAuthProperties.getProviders().get("naver");

        OAuthTokenResponse token = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("nid.naver.com")
                        .path("/oauth2.0/token")
                        .queryParam("grant_type", "authorization_code")
                        .queryParam("client_id", p.getClientId())
                        .queryParam("client_secret", p.getClientSecret())
                        .queryParam("code", code)
                        .queryParam("state", state)
                        .build())
                .retrieve()
                .bodyToMono(OAuthTokenResponse.class)
                .block();

        Map<String, Object> body = webClient.get()
                .uri(p.getUserInfoUri())
                .header("Authorization", "Bearer " + token.getAccessToken())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        Map<String, Object> response = (Map<String, Object>) body.get("response");

        return OAuthUserInfo.builder()
                .provider("naver")
                .providerUserId(String.valueOf(response.get("id")))
                .email((String) response.get("email"))
                .nickname((String) response.get("nickname"))
                .profileImage((String) response.get("profile_image"))
                .build();
    }
}