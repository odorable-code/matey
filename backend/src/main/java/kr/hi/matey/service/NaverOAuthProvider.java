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

        // 네이버 공식 예제는 토큰 요청에 redirect_uri(콜백 URL) 포함 — 인가 단계와 동일해야 함
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", p.getClientId());
        form.add("client_secret", p.getClientSecret());
        form.add("redirect_uri", p.getRedirectUri());
        form.add("code", code);
        form.add("state", state);

        OAuthTokenResponse token = webClient.post()
                .uri(p.getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
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

        String birthyear = (String) response.get("birthyear");
        String birthday  = (String) response.get("birthday"); // "MM-DD"
        String birthdate = (birthyear != null && birthday != null)
                ? birthyear + "-" + birthday
                : null;

        return OAuthUserInfo.builder()
                .provider("naver")
                .providerUserId(String.valueOf(response.get("id")))
                .email((String) response.get("email"))
                .nickname((String) response.get("nickname"))
                .profileImage((String) response.get("profile_image"))
                .birthdate(birthdate)
                .gender((String) response.get("gender"))
                .build();
    }
}