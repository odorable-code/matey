package kr.hi.matey.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.hi.matey.dao.AuthDAO;
import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.vo.UserVO;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class AuthService {
	
	private final AuthDAO authDAO;
	private final BCryptPasswordEncoder encoder;
	private final CustomUser customuser;
	private final JavaMailSender mailSender;
	private final UserVO userVO;
	

	public boolean signup(UserDTO user) {
		String encodedPw = encoder.encode(user.getPassword());
        user.setPassword(encodedPw);
        try {
            boolean result = authDAO.insertUser(user);
            return result;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


	public boolean login(UserDTO user) {
		try {
            boolean result = authDAO.confirmUser(user);
            return result;
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
	}


	public String findId(String email) {
		// TODO Auto-generated method stub
		return null;
	}


	public boolean sendLink(String email) {
		// 고유 토큰 생성 (UUID)
        try{
        	String token = UUID.randomUUID().toString();
        
        
        // DB에 토큰 저장 (나중에 비번 바꿀 때 "검증용")
        boolean updateToken = authDAO.updateResetToken(email, token); 
        
        // DB 저장 실패시 메일 안 보냄
        if (!updateToken) {
            return false;
        }

        // 메일 발송
        String resetLink = "http://localhost:8080/reset-password?token=" + token;
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[서비스 이름] 비밀번호 재설정 안내");
        message.setText("아래 링크를 클릭하여 비밀번호를 재설정하세요.\n\n" + resetLink);

        // 작성한 메일을 실제로 발송
        mailSender.send(message);
        
        return true;
        
        }catch(Exception e){
        	System.out.println(e);
        	return false;
        }
        
	}


	public boolean isEmailDuplicate(String email) {
		
		boolean isEmailDuplicate = authDAO.isEmailDuplicate(email);
		return isEmailDuplicate;
	}


	@Transactional
	public boolean updatePassword(String token, String newpassword) {
		
		// 1. DAO는 UserVO(순수 정보)를 가져옵니다.
		Optional<UserVO> voOpt = authDAO.findUserVOByToken(token);

		if (voOpt.isPresent()) {
			// 2. 가져온 VO를 가공된 상자(CustomUser)에 담습니다.
	        UserVO vo = voOpt.get();
	        CustomUser customUser = new CustomUser(vo);
		    
		    if (customUser.getUser().getTokenExpiryDate().isBefore(LocalDateTime.now())){
		    	return false;
		    }
		}
		else {
			return false;
		}
		
	        // 3. 새로운 비밀번호 암호화 (BCrypt 사용 권장)
	        String encodedPassword = encoder.encode(newpassword);
	        
	        if (encodedPassword == null || encodedPassword.isEmpty()) {
	            return false; // 암호화 실패 (현실적으로 거의 발생하지 않음)
	        }
	        
	        boolean isUpdated = authDAO.updateFinalPassword(userVO.getEmail(), encodedPassword);
	        
	        if(isUpdated) {
	            // 성공하면 토큰 무효화 (이것도 DB에 반영되어야 함)
	            authDAO.clearResetToken(userVO.getEmail());
	            return true;
	        }
	        else {
	        	return false;
	        }
		}


	public void enableAutoLogin(Long userId, String refreshToken) {
		// 1. 현재 시간 기준으로 30일 뒤 만료일 계산
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(30);
        
        // 2. DAO에게 데이터 전달
        authDAO.saveAutoLoginInfo(userId, refreshToken, expiryDate);
		
	}
	
	
	public boolean isValidRefreshToken(String subject, String refreshToken) {
		// TODO Auto-generated method stub
		return false;
	}


	public void disableAutoLogin(Long userId) {
		authDAO.removeToken(userId);
		
	}


	
	}

