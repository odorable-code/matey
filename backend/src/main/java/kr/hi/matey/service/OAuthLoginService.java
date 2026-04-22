package kr.hi.matey.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import kr.hi.matey.config.AppProperties;
import kr.hi.matey.dao.SocialAuthDAO;
import kr.hi.matey.dto.OAuthUserInfo;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.util.OAuthStateStore;
import kr.hi.matey.vo.UserVO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthLoginService {

    private final List<OAuthProvider> providers;
    private final SocialAuthDAO socialAuthDAO;
    private final JwtTokenProvider jwtTokenProvider;
    private final OAuthStateStore stateStore;
    private final AppProperties appProperties;

    private Map<String, OAuthProvider> providerMap;

    @PostConstruct
    void init() {
        providerMap = providers.stream()
                .collect(Collectors.toMap(OAuthProvider::providerName, Function.identity()));
    }

    public String buildAuthorizeUrl(String providerName) {
        OAuthProvider provider = getProvider(providerName);
        String state = stateStore.create();
        return provider.buildAuthorizeUrl(state);
    }

    public String login(String providerName, String code, String state) {
        if ("naver".equals(providerName)) {
            if (state == null || !stateStore.consume(state)) {
                throw new IllegalArgumentException("유효하지 않은 state 값입니다.");
            }
        }

        OAuthProvider provider = getProvider(providerName);
        OAuthUserInfo userInfo = provider.getUserInfo(code, state);

        UserVO user = socialAuthDAO.findByProviderAndProviderUserId(
                userInfo.getProvider(), userInfo.getProviderUserId());

        boolean isNewUser = false;

        if (user == null) {
            isNewUser = true;

            user = new UserVO();
            user.setProvider(userInfo.getProvider());
            user.setProviderUserId(userInfo.getProviderUserId());
            user.setEmail(userInfo.getEmail());
            user.setName(userInfo.getNickname());
            user.setProfileImage(userInfo.getProfileImage());
            user.setRole("USER");

            user.setLoginId(userInfo.getProvider() + "_" + userInfo.getProviderUserId());
            user.setPassword(UUID.randomUUID().toString());

            socialAuthDAO.insertSocialUser(user);
        }

        String token = jwtTokenProvider.createToken(user.getLoginId(), user.getRole());

        return appProperties.getFrontendUrl()
                + "/login/social-success?token=" + token
                + "&provider=" + providerName
                + "&newUser=" + isNewUser;
    }

    private OAuthProvider getProvider(String providerName) {
        OAuthProvider provider = providerMap.get(providerName);
        if (provider == null) {
            throw new IllegalArgumentException("지원하지 않는 provider 입니다: " + providerName);
        }
        return provider;
    }
}