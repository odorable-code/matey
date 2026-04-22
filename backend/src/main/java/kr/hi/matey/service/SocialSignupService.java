package kr.hi.matey.service;

import java.util.UUID;

import kr.hi.matey.domain.UserVO;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpSession;
import kr.hi.matey.dao.SocialLoginDAO;
import kr.hi.matey.dto.PendingSocialUser;
import kr.hi.matey.dto.SocialLoginDTO;
import kr.hi.matey.dto.SocialSignupRequestDTO;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SocialSignupService {

    private final SocialLoginDAO socialLoginDAO;
    private final JwtTokenProvider jwtTokenProvider;

    public String signup(SocialSignupRequestDTO request, HttpSession session) {
        PendingSocialUser pendingUser =
                (PendingSocialUser) session.getAttribute("PENDING_SOCIAL_USER");

        if (pendingUser == null) {
            throw new IllegalArgumentException("소셜 회원가입 세션 정보가 없습니다.");
        }

        UserVO user = new UserVO();
        user.setEmail(pendingUser.getEmail());
        user.setPassword(UUID.randomUUID().toString());
        user.setNickname(pendingUser.getNickname());
        user.setUserName(request.getUserName());
        user.setUserBirth(request.getUserBirth());
        user.setGender(request.getGender());
        user.setProfileImage(pendingUser.getProfileImage());
        user.setRole("USER");
        user.setLoginType(pendingUser.getProvider());
        user.setStatus("ACTIVE");
        user.setPoint(0);
        user.setSubscriptionGrade("FREE");
        user.setIsAdult(request.getIsAdult());
        user.setIsNotiAgree(request.getIsNotiAgree());
        user.setIsTermsAgreed(request.getIsTermsAgreed());
        user.setIsPrivacyAgreed(request.getIsPrivacyAgreed());
        user.setIsMarketingAgreed(request.getIsMarketingAgreed());

        socialLoginDAO.insertUser(user);

        SocialLoginDTO socialLogin = new SocialLoginDTO();
        socialLogin.setProvider(pendingUser.getProvider());
        socialLogin.setProviderUserId(pendingUser.getProviderUserId());
        socialLogin.setSocialAccessToken(null);
        socialLogin.setSocialRefreshToken(null);
        socialLogin.setUserId(user.getUserId());

        socialLoginDAO.insertSocialLogin(socialLogin);

        session.removeAttribute("PENDING_SOCIAL_USER");

        CustomUser customUser = new CustomUser(user);
        return jwtTokenProvider.createAccessToken(customUser);
    }
}