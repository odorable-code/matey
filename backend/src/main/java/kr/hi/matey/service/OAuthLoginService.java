package kr.hi.matey.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpSession;
import kr.hi.matey.config.AppProperties;
import kr.hi.matey.dao.SocialLoginDAO;
import kr.hi.matey.dto.OAuthUserInfo;
import kr.hi.matey.dto.PendingSocialUser;
import kr.hi.matey.dto.SocialLoginDTO;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.util.OAuthStateStore;
import kr.hi.matey.vo.UserVO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OAuthLoginService {

    private final List<OAuthProvider> providers;
    private final SocialLoginDAO socialLoginDAO;
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

    public String login(String providerName, String code, String state, HttpSession session) {
        if ("naver".equals(providerName)) {
            if (state == null || !stateStore.consume(state)) {
                throw new IllegalArgumentException("유효하지 않은 state 값입니다.");
            }
        }

        OAuthProvider provider = getProvider(providerName);
        OAuthUserInfo userInfo = provider.getUserInfo(code, state);

        SocialLoginDTO socialLogin = socialLoginDAO.findByProviderAndProviderUserId(
                userInfo.getProvider().toUpperCase(),
                userInfo.getProviderUserId()
        );

        if (socialLogin != null) {
            UserVO user = socialLoginDAO.findUserByUserId(socialLogin.getUserId());

            CustomUser customUser = new CustomUser(user);
            String token = jwtTokenProvider.createAccessToken(customUser);

            return appProperties.getFrontendUrl()
                    + "/login/social-success?token=" + token
                    + "&provider=" + providerName
                    + "&newUser=false";
        }

        PendingSocialUser pendingUser = new PendingSocialUser();
        pendingUser.setProvider(userInfo.getProvider().toUpperCase());
        pendingUser.setProviderUserId(userInfo.getProviderUserId());
        pendingUser.setEmail(userInfo.getEmail());
        pendingUser.setNickname(userInfo.getNickname());
        pendingUser.setProfileImage(userInfo.getProfileImage());

        session.setAttribute("PENDING_SOCIAL_USER", pendingUser);

        return appProperties.getFrontendUrl() + "/signup/social";
    }

    private OAuthProvider getProvider(String providerName) {
        OAuthProvider provider = providerMap.get(providerName);
        if (provider == null) {
            throw new IllegalArgumentException("지원하지 않는 provider 입니다: " + providerName);
        }
        return provider;
    }
}