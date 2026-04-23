package kr.hi.matey.service;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import kr.hi.matey.config.OAuthProperties;
import kr.hi.matey.dto.OAuthTokenResponse;
import kr.hi.matey.dto.OAuthUserInfo;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KakaoOAuthProvider implements OAuthProvider {

    private final OAuthProperties oAuthProperties;
    private final WebClient webClient;

    @Override
    public String providerName() {
        return "kakao";
    }

    @Override
    public String buildAuthorizeUrl(String state) {
        OAuthProperties.Provider p = oAuthProperties.getProviders().get("kakao");

        // state는 콜백에 그대로 돌아오니까(네이버랑 똑같이) OAuthLoginService 쪽 1회용 store랑 맞출 수 있음
        return UriComponentsBuilder.fromUriString(p.getAuthorizeUri())
                .queryParam("client_id", p.getClientId())
                .queryParam("redirect_uri", p.getRedirectUri())
                .queryParam("response_type", "code")
                .queryParam("state", state)
                .build()
                .toUriString();
    }

    @Override
    @SuppressWarnings("unchecked")
    public OAuthUserInfo getUserInfo(String code, String state) {
        OAuthProperties.Provider p = oAuthProperties.getProviders().get("kakao");

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", p.getClientId());
        form.add("redirect_uri", p.getRedirectUri());
        form.add("code", code);
        if (p.getClientSecret() != null && !p.getClientSecret().isBlank()) {
            form.add("client_secret", p.getClientSecret());
        }

        OAuthTokenResponse token = webClient.post()
                .uri(p.getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                // 위에서 String 붙이면 code에 & 같은 거 들어가면 깨질 수 있어서 폼으로 보냄
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .bodyToMono(OAuthTokenResponse.class)
                .block();

        Map<String, Object> body = webClient.post()
                .uri(p.getUserInfoUri())
                .header("Authorization", "Bearer " + token.getAccessToken())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
        Map<String, Object> profile = kakaoAccount == null ? null : (Map<String, Object>) kakaoAccount.get("profile");

        return OAuthUserInfo.builder()
                .provider("kakao")
                .providerUserId(String.valueOf(body.get("id")))
                .email(kakaoAccount == null ? null : (String) kakaoAccount.get("email"))
                .nickname(profile == null ? null : (String) profile.get("nickname"))
                .profileImage(profile == null ? null : (String) profile.get("profile_image_url"))
                .build();
    }
}