package kr.hi.matey.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import kr.hi.matey.config.AppProperties;
import kr.hi.matey.dao.SocialLoginDAO;
import kr.hi.matey.dto.OAuthUserInfo;
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

    public String login(String providerName, String code, String state) {
        if ("naver".equals(providerName)) {
            if (state == null || !stateStore.consume(state)) {
                throw new IllegalArgumentException("유효하지 않은 state 값입니다.");
            }
        }

        OAuthProvider provider = getProvider(providerName);
        OAuthUserInfo userInfo = provider.getUserInfo(code, state);

        SocialLoginDTO socialLogin = socialLoginDAO.findByProviderAndProviderUserId(
                userInfo.getProvider(),
                userInfo.getProviderUserId()
        );

        UserVO user;
        boolean isNewUser = false;

        if (socialLogin != null) {
            user = socialLoginDAO.findUserByUserId(socialLogin.getUserId());
        } else {
            isNewUser = true;

            user = new UserVO();
            user.setEmail(userInfo.getEmail());
            user.setPassword(UUID.randomUUID().toString());
            user.setNickname(userInfo.getNickname());
            user.setUserName(userInfo.getNickname());
            user.setProfileImage(userInfo.getProfileImage());
            user.setRole("USER");
            user.setLoginType(userInfo.getProvider().toUpperCase());
            user.setStatus("ACTIVE");
            user.setPoint(0);
            user.setSubscriptionGrade("FREE");
            user.setIsAdult(false);
            user.setIsNotiAgree(false);
            user.setIsTermsAgreed(true);
            user.setIsPrivacyAgreed(true);
            user.setIsMarketingAgreed(false);

            socialLoginDAO.insertUser(user);

            SocialLoginDTO newSocialLogin = new SocialLoginDTO();
            newSocialLogin.setProvider(userInfo.getProvider().toUpperCase());
            newSocialLogin.setProviderUserId(userInfo.getProviderUserId());
            newSocialLogin.setSocialAccessToken(null);
            newSocialLogin.setSocialRefreshToken(null);
            newSocialLogin.setUserId(user.getUserId());

            socialLoginDAO.insertSocialLogin(newSocialLogin);
        }

        CustomUser customUser = new CustomUser(user);
        String token = jwtTokenProvider.createAccessToken(customUser);

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