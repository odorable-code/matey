package kr.hi.matey.dao;

import kr.hi.matey.dto.UserDTO;
import kr.hi.matey.vo.UserVO;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserDAO {
	
//	boolean insertUser(@Param("user") UserDTO user);
//	UserVO selectUser(@Param("userId") String userId);
//	List<UserVO> selectUsers();
//
//	boolean deleteUser(@Param("userNum") int userNum);
//
//	boolean updateUser(@Param("user") UserDTO user, @Param("userNum") int userNum);
//
//	// findId-서연 휴대폰번호와 이메일로 아이디 찾기
//	String findUserId(@Param("phone") String phone, @Param("email") String email);
//
////    //findPw-서연
////    UserVO selectUserByIdAndEmail(@Param("userId") String userId, @Param("userEmail") String userEmail);
//
//	//userLogin-서연
//	UserVO findByUserId(@Param("userId") String userId );
//
//	//userSignup-서연
//	// 1. 아이디 중복 확인 (존재하면 1, 없으면 0 반환하도록 XML 작성 필요)
//	int existsByUserId(@Param("userId") String userId);
//
//	// 2. 회원가입 (기존 insertUser를 사용해도 되지만, 명확하게 분리하고 싶을 경우 추가)
//	// 리액트에서 온 데이터를 UserDTO로 받아서 처리합니다.
//	boolean signupUser(@Param("user") UserDTO user);
//
//	UserVO selectUserByUserNum(int userNum);
//
//	boolean existsByAdminId(String adminId);
//	boolean existsByAdminEmail(String adminEmail);
//	boolean existsByAdminBusinessNum(String businessNum);
//	boolean existsByAdminHoName(String hoName);
	
}
