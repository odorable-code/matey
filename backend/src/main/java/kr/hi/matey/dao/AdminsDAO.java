package kr.hi.matey.dao;

import kr.hi.matey.dto.AdminsDTO;
import kr.hi.matey.vo.AdminsVO;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper  // ✅ @Mapper 어노테이션 확인
public interface AdminsDAO {
    boolean insertAdmin(@Param("dto") AdminsDTO dto);
    AdminsVO selectAdmin(@Param("adminId") String adminId);
    AdminsDTO selectAdminById(String adminId);
}
