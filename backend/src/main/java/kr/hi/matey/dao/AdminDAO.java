package kr.hi.matey.dao;

import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface AdminDAO {
    // [사용자 관리]
    List<UserDTO2> selectAdminUserList(@Param("keyword") String keyword,
                                      @Param("roleCode") String roleCode,
                                      @Param("status") String status);
    int updateUserStatus(@Param("userId") Long userId, @Param("status") String status);
    int updateUserRole(@Param("userId") Long userId, @Param("roleId") Long roleId);
    // 특정 이메일로 ROLE_ID 찾기 (권한 변경용)
    Long selectRoleIdByCode(@Param("roleCode") String roleCode);

    // [피드백 관리]
    List<FeedbackDTO> selectSupportList(@Param("status") String status);
    int updateSupportStatus(@Param("supportId") Long supportId, @Param("status") String status);

    // [통계 - 개요]
    List<Map<String, Object>> selectEmotionStats(); // 감정 분포
    List<Map<String, Object>> selectCategoryStats(); // 카테고리(상담주제) 분포
    Map<String, Object> selectSummaryCounts(); // 상단 요약 카드용 (전체유저, 활성유저 등)

    // [활동 로그]
    // 별도의 로그 테이블(ADMIN_ACTION_LOG)이 있다고 가정하거나 SUPPORT_ANSWER 기록 조회
    List<Map<String, Object>> selectAdminActivityLogs(@Param("keyword") String keyword);
    int insertAdminLog(@Param("log") Map<String, Object> log);
}