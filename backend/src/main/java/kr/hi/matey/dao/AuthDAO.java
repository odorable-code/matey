package kr.hi.matey.dao;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.vo.UserVO;
import kr.hi.matey.util.CustomUser;

@Mapper
public interface AuthDAO {
	
	
	boolean insertUser(@Param("user") UserDTO user);

	boolean confirmUser(@Param("user") UserDTO user);

	boolean updateResetToken(String email, String token);

	Optional<CustomUser> findByResetToken(String token);

	boolean isEmailDuplicate(String email);

	Optional<UserVO> findUserVOByToken(String token);

	boolean updateFinalPassword(String email, String encodedPassword);

	boolean clearResetToken(String email);
	
}
