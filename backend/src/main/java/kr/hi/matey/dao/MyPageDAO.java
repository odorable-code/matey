package kr.hi.matey.dao;

import kr.hi.matey.domain.UserProfileDTO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MyPageDAO {
    // 사용자의 기본 프로필과 구독 정보를 조인해서 가져옴
    UserProfileDTO getUserProfile(@Param("userId") String userId);

    // 결제 내역 조회
    List<Map<String, Object>> getPaymentHistory(@Param("userId") String userId);
}