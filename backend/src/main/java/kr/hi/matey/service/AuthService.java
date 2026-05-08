package kr.hi.matey.service;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.hi.matey.dao.AuthDAO;
import kr.hi.matey.dto.PasswordResetDTO;
import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.vo.RoleVO;
import kr.hi.matey.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
	
	private final AuthDAO authDAO;
	private final BCryptPasswordEncoder encoder;
	private final JavaMailSender mailSender;

	@Value("${app.frontend-url:http://localhost:3000}")
	private String frontendBaseUrl;

	@Value("${jwt.refresh-token-validity-in-seconds:604800}")
	private long refreshTokenValiditySeconds;
	
	
	// 닉네임 중복 확인(회원가입시)
	public boolean isNicknameDuplicateSignup(String nickname) {
		int isNicknameDuplicateSignup = authDAO.isNicknameDuplicateSignup(nickname);
		
		if(isNicknameDuplicateSignup > 0) {
			return true;
		}
		return false;
	}
	
	
	public boolean isEmailDuplicateSignup(String email) {
			
			int isEmailDuplicateSignup = authDAO.isEmailDuplicateSignup(email);
			return isEmailDuplicateSignup > 0;
		}

	// 회원가입
	public boolean signup(UserDTO user) {
		String encodedPw = encoder.encode(user.getPassword());
		UserVO userVO = new UserVO();
		
		userVO.setUserName(user.getUserName());
		userVO.setEmail(user.getEmail());
	    userVO.setNickname(user.getNickname());
	    userVO.setPassword(encodedPw);
	    userVO.setTermsAgreed(user.isTermsAgreed() ? 1 : 0);
	    userVO.setPrivacyAgreed(user.isPrivacyAgreed() ? 1 : 0);
	    userVO.setMarketingAgreed(user.isMarketingAgreed() ? 1 : 0);
		userVO.setPassword(encodedPw);
		RoleVO roleVO = new RoleVO();
	    roleVO.setRole_code("USER");
	    userVO.setRole(roleVO);
		
		
        try {
            boolean result = authDAO.insertUser(userVO);
            
            if(result) {
                authDAO.insertUserRole(userVO.getUserId(), 1);
            }
            
            return result;
            
        } catch (Exception e) {
            log.warn("signup failed for email={}", user.getEmail(), e);
            return false;
        }
    }


	// 아이디(이메일) 찾기
	public String findId(UserDTO user) {
		String id = authDAO.findId(user);
		return id;
	}
	
	// 비번 재설정
	public boolean isEmailDuplicatePw(UserDTO user) {
		
		UserVO userVO = new UserVO();
	    userVO.setEmail(user.getEmail());
		
		boolean isEmailDuplicatePW = authDAO.isEmailDuplicatePw(userVO);
		return isEmailDuplicatePW;
	}


	// 비번 재설정(링크 전송)
	public boolean sendLink(UserDTO user) {
		
        try{
        	
        	// 고유 토큰 생성 (UUID)
        	// 비밀번호 재설정 페이지로 연결되는 일회용 비밀 주소(토큰)를 만들 때 사용(전 세계에서 중복될 확률이 거의 없는, 아주 고유한 식별용 문자열(아이디)을 하나 생성)
        	String token = UUID.randomUUID().toString();
        
        
        // DB에 토큰 저장 (나중에 비번 바꿀 때 "검증용")
        boolean updateToken = authDAO.updateResetToken(user.getEmail(), token); 
        
        // DB 저장 실패시 메일 안 보냄
        if (!updateToken) {
            return false;
        }

        String base = frontendBaseUrl.replaceAll("/$", "");
        String resetLink = base + "/reset-password?token=" + token;
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("[서비스 이름] 비밀번호 재설정 안내");
        message.setText("아래 링크를 클릭하여 비밀번호를 재설정하세요.\n\n" + resetLink);

        // 작성한 메일을 실제로 발송
        mailSender.send(message);
        
        return true;
        
        }catch(Exception e){
        	log.warn("sendLink failed for email={}", user.getEmail(), e);
        	return false;
        }
        
	}


	// 비번 재설정(재설정된 비번 db에 저장)
	@Transactional
	public boolean updatePassword(String token, String newpassword) {

		Optional<PasswordResetDTO> resetOpt = authDAO.findUserVOByToken(token);

		if (resetOpt.isEmpty()) {
			return false;
		}

		PasswordResetDTO dto = resetOpt.get();
		
	    
        if (dto.getExpiresAt() == null || dto.getExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }
		
	        // 새로운 비밀번호 암호화 (BCrypt 사용 권장)
	        String encodedPassword = encoder.encode(newpassword);
	        
	        if (encodedPassword == null || encodedPassword.isEmpty()) {
	            return false; // 암호화 실패 (현실적으로 거의 발생하지 않음)
	        }
	        
	        boolean isUpdated = authDAO.updateFinalPassword(dto.getEmail(), encodedPassword);
	        
	        if(isUpdated) {
	            // 4. 성공 시 t.used_at에 시점 기록 (토큰 무효화)
	            authDAO.markTokenAsUsed(dto.getEmail()); 
	            return true;
	        }
	        
	        else {
	        	return false;
	        }
		}


	/** 로그인/회원가입 시 발급한 리프레시 JWT를 DB에 저장(JWT 만료 설정과 동일한 기간) */
	public void persistRefreshToken(Long userId, String refreshToken) {
		LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(refreshTokenValiditySeconds);
		authDAO.saveAutoLoginInfo(userId, refreshToken, expiryDate);
	}
	
	
	public boolean isValidRefreshToken(String subject, String refreshToken) {
		if (subject == null || subject.isBlank() || refreshToken == null || refreshToken.isBlank()) {
			return false;
		}
		String stored = authDAO.findStoredRefreshTokenByEmail(subject);
		return stored != null && Objects.equals(stored, refreshToken);
	}


	public boolean removeAutoLoginToken(Long userId) {
		int removeAutoLoginToken = authDAO.removeAutoLoginToken(userId);
		return removeAutoLoginToken > 0;
	}

	

}
