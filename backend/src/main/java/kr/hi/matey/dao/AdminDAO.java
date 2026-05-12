package kr.hi.matey.dao;

import kr.hi.matey.dto.AdminBotStatsRow;
import kr.hi.matey.dto.AdminBotUpsertDTO;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface AdminDAO {
    // ==========================================
    // 실시간 운영 통계 및 지표
    // ==========================================
    Map<String, Object> selectDashboardOverview();
    List<Map<String, Object>> selectLiveMetrics();
    List<Map<String, Object>> selectEmotionDistribution();
    List<Map<String, Object>> selectConcernDistribution();

    // ==========================================
    // 사용자 관리 (CRUD + 필터/검색)
    // ==========================================
    List<UserDTO2> selectUsers(
            @Param("keyword") String keyword,
            @Param("role") String role,
            @Param("status") String status
    );
    UserDTO2 selectUserById(@Param("userId") Long userId);
    int updateUser(@Param("userId") Long userId, @Param("data") Map<String, Object> data);
    int updateUserRole(@Param("userId") Long userId, @Param("roleCode") String roleCode);
    int deleteUser(@Param("userId") Long userId); // Soft delete (status = DELETED)

    // ==========================================
    // 일괄 작업 (Batch Operations)
    // ==========================================
    int bulkUpdateUserStatus(@Param("userIds") List<Long> userIds, @Param("status") String status);
    int bulkUpdateUserRole(@Param("userIds") List<Long> userIds, @Param("roleCode") String roleCode);

    // ==========================================
    // 사용자 피드백 관리
    // ==========================================
    List<FeedbackDTO> selectFeedbacks(@Param("status") String status);
    FeedbackDTO selectFeedbackById(@Param("supportId") Long supportId);
    int updateFeedbackStatus(@Param("supportId") Long supportId, @Param("status") String status);
    int deleteFeedback(@Param("supportId") Long supportId);

    int insertSupportAnswer(
            @Param("supportId") Long supportId,
            @Param("content") String content,
            @Param("adminUserId") Long adminUserId
    );

    /** 답변 추가 전 건수 — 0이면 최초 등록, 1 이상이면 추가 답변(화면상 수정) */
    int countSupportAnswersBySupportId(@Param("supportId") Long supportId);

    Long selectSupportUserId(@Param("supportId") Long supportId);

    // ==========================================
    // 상담봇 관리 (랭킹·전월 이벤트)
    // ==========================================
    List<AdminBotStatsRow> selectBotsWithPrevMonthBreakdown(
            @Param("year") int year,
            @Param("month") int month
    );

    long countRecommendEventsInMonth(@Param("year") int year, @Param("month") int month);

    int countBotById(@Param("botId") long botId);

    int insertBot(AdminBotUpsertDTO dto);

    int updateBot(AdminBotUpsertDTO dto);

}
