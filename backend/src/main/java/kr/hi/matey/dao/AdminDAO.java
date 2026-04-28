package kr.hi.matey.dao;

import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface AdminDAO {
    // ==========================================
    // 통계 & 대시보드
    // ==========================================
    
    Map<String, Object> selectSummaryCounts();
    List<Map<String, Object>> selectEmotionStats();
    List<Map<String, Object>> selectCategoryStats();
    Long selectUserCount();
    Long selectActiveConversationCount();
    Integer selectAvgAttendance();

    // ==========================================
    // 사용자 관리
    // ==========================================
    
    List<UserDTO2> selectAdminUserList(@Param("keyword") String keyword,
                                      @Param("roleCode") String roleCode,
                                      @Param("status") String status);
    int updateUserStatus(@Param("userId") Long userId, @Param("status") String status);
    int updateUserNickname(@Param("userId") Long userId, @Param("nickname") String nickname);
    int updateUserRole(@Param("userId") Long userId, @Param("roleId") Long roleId);
    int deleteUser(@Param("userId") Long userId);
    Long selectRoleIdByCode(@Param("roleCode") String roleCode);

    // ==========================================
    // 피드백 관리
    // ==========================================
    
    List<FeedbackDTO> selectSupportList(@Param("status") String status);
    int updateSupportStatus(@Param("supportId") Long supportId, @Param("status") String status);

    // ==========================================
    // 활동 로그
    // ==========================================
    
    List<Map<String, Object>> selectAdminActivityLogs(
            @Param("keyword") String keyword,
            @Param("period") String period,
            @Param("category") String category,
            @Param("actor") String actor);
    int insertAdminLog(@Param("log") Map<String, Object> log);
}