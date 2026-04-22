package kr.hi.matey.dao;

import kr.hi.matey.domain.UserDTO;
import kr.hi.matey.domain.UserVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface UserDAO {
	
	boolean insertUser(@Param("user") UserDTO user);
	
}
