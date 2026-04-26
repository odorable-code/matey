package kr.hi.matey.dao;

import java.time.LocalDateTime;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.dto.PasswordResetDTO;
import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.vo.UserVO;
import kr.hi.matey.util.CustomUser;

@Mapper
public interface AuthDAO {
	
	// 이메일 중복 확인(회원가입시)
	int isEmailDuplicateSignup(String email);
	
	boolean insertUser(UserVO userVO);

	UserVO findByEmail(String email);
	
	String findId(UserDTO user);
	
	// 비번 재설정
	boolean isEmailDuplicatePw(UserVO userVO);

	boolean updateResetToken(String email, String token);

	Optional<PasswordResetDTO> findUserVOByToken(String token);

	boolean updateFinalPassword(String email, String encodedPassword);

	boolean clearResetToken(@Param("email") String email);

	void saveAutoLoginInfo(@Param("userId") Long userId, @Param("refreshToken") String refreshToken, @Param("expiryDate") LocalDateTime expiryDate);

	int removeAutoLoginToken(Long userId, Object object);

	UserVO selectUser(String email);

	


	

	

	
	
	
}
