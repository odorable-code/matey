package kr.hi.matey.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.hi.matey.domain.UserDTO;
import kr.hi.matey.domain.UserVO;

@Mapper
public interface AuthDAO {
	boolean insertUser(@Param("user") UserDTO user);
	
}
