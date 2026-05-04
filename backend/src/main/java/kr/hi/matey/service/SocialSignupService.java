package kr.hi.matey.service;

import java.sql.Date;
import java.util.Objects;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpSession;
import kr.hi.matey.dao.AuthDAO;
import kr.hi.matey.dao.SocialLoginDAO;
import kr.hi.matey.dto.PendingSocialUser;
import kr.hi.matey.dto.SocialLoginDTO;
import kr.hi.matey.dto.SocialSignupRequestDTO;
import kr.hi.matey.security.jwt.JwtTokenProvider;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.vo.UserVO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SocialSignupService {

    private final SocialLoginDAO socialLoginDAO;
    private final AuthDAO authDAO;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public String signup(SocialSignupRequestDTO request, HttpSession session) {
        PendingSocialUser pendingUser =
                (PendingSocialUser) session.getAttribute("PENDING_SOCIAL_USER");

        if (pendingUser == null) {
            throw new IllegalArgumentException("소셜 회원가입 세션 정보가 없습니다.");
        }

        UserVO user = new UserVO();
        user.setEmail(pendingUser.getEmail());
        user.setPassword(passwordEncoder.encode("SOCIAL_" + UUID.randomUUID()));
        user.setNickname(pendingUser.getNickname());
        user.setUserName(request.getUserName());
        if (request.getUserBirth() != null) {
            user.setBirthDateSql(new Date(request.getUserBirth()));
        }
        user.setGender(mapGenderToDb(request.getGender()));
        user.setProfile_image(pendingUser.getProfileImage());
        user.setLogin_type(Objects.requireNonNullElse(pendingUser.getProvider(), "LOCAL").toUpperCase());
        user.setStatus("ACTIVE");
        user.setTermsAgreed(request.getIsTermsAgreed());
        user.setPrivacyAgreed(request.getIsPrivacyAgreed());
        user.setMarketingAgreed(request.getIsMarketingAgreed());

        socialLoginDAO.insertUser(user);
        authDAO.insertUserRole(user.getUserId(), 1);

        SocialLoginDTO socialLogin = new SocialLoginDTO();
        socialLogin.setProvider(pendingUser.getProvider());
        socialLogin.setProviderUserId(pendingUser.getProviderUserId());
        socialLogin.setUserId(user.getUserId());

        socialLoginDAO.insertSocialLogin(socialLogin);

        session.removeAttribute("PENDING_SOCIAL_USER");

        UserVO loaded = socialLoginDAO.findUserByUserId(user.getUserId());
        CustomUser customUser = new CustomUser(loaded);
        return jwtTokenProvider.createAccessToken(customUser);
    }

    /** DB USER.gender VARCHAR — 프론트 숫자 코드를 문자열로 매핑 */
    private static String mapGenderToDb(Long genderCode) {
        if (genderCode == null) {
            return null;
        }
        if (genderCode == 2L) {
            return "FEMALE";
        }
        return "MALE";
    }
}
