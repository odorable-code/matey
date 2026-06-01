package kr.hi.matey.dao;

import java.time.LocalDateTime;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.dto.PasswordResetDTO;
import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.vo.UserVO;

@Mapper
public interface AuthDAO {

	// 이메일 중복 확인(회원가입시)
	int isEmailDuplicateSignup(String email);

	// 닉네임 중복 확인(회원가입시)
	int isNicknameDuplicateSignup(String nickname);

	boolean insertUser(UserVO userVO);

	int insertUserRole(@Param("userId") Long userId, @Param("roleId") int roleId);

	int insertUserSetting(@Param("userId") Long userId);

	int insertDefaultNotificationSettings(@Param("userId") Long userId);

	UserVO findByEmail(String email);

	String findId(UserDTO user);

	// 비번 재설정
	boolean isEmailDuplicatePw(UserVO userVO);

	boolean updateResetToken(@Param("email") String email, @Param("token") String token);

	Optional<PasswordResetDTO> findUserVOByToken(String token);

	boolean updateFinalPassword(@Param("email") String email, @Param("encodedPassword") String encodedPassword);

	void markTokenAsUsed(@Param("email") String email);

	boolean clearResetToken(@Param("email") String email);

	void saveAutoLoginInfo(@Param("userId") Long userId, @Param("refreshToken") String refreshToken,
			@Param("expiryDate") LocalDateTime expiryDate);

	int removeAutoLoginToken(@Param("userId") Long userId);

	/** 로그인 성공 시 USER.last_login_at 갱신 */
	int updateLastLogin(@Param("userId") Long userId);

	/** AUTO_LOGIN에 저장된 리프레시 JWT(컬럼명 token_hash) — 만료 전 행만 */
	String findStoredRefreshTokenByEmail(@Param("email") String email);

	UserVO selectUser(String email);

}
