package kr.hi.matey.dao;

import kr.hi.matey.domain.HospitalAdminsDTO;
import kr.hi.matey.domain.HospitalAdminsVO;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper  // ✅ @Mapper 어노테이션 확인
public interface HospitalAdminsDAO {
    boolean insertAdmin(@Param("dto") HospitalAdminsDTO dto);
    HospitalAdminsVO selectAdmin(@Param("adminId") String adminId);
    HospitalAdminsDTO selectAdminById(String adminId);
}
