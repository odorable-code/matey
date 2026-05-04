package kr.hi.matey.service;

import kr.hi.matey.dao.AdminDAO;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final AdminDAO adminDAO;

    // ==========================================
    // 실시간 운영 통계 및 지표
    // ==========================================
    public Map<String, Object> getDashboardOverview() {
        Map<String, Object> data = new HashMap<>();
        data.put("overview", adminDAO.selectDashboardOverview());
        data.put("liveMetrics", adminDAO.selectLiveMetrics());
        data.put("emotionDistribution", adminDAO.selectEmotionDistribution());
        data.put("concernDistribution", adminDAO.selectConcernDistribution());
        return data;
    }

    public List<Map<String, Object>> getLiveMetrics() {
        return adminDAO.selectLiveMetrics();
    }

    // ==========================================
    // 사용자 관리 (CRUD + 필터/검색)
    // ==========================================
    public List<UserDTO2> findUsers(String keyword, String role, String status) {
        return adminDAO.selectUsers(keyword, role, status);
    }

    public UserDTO2 getUserDetail(Long userId) {
        return adminDAO.selectUserById(userId);
    }

    @Transactional
    public void updateUser(Long userId, Map<String, Object> data, String adminActor) {
        adminDAO.updateUser(userId, data);
    }

    @Transactional
    public void updateUserRole(Long userId, String roleCode, String adminActor) {
        adminDAO.updateUserRole(userId, roleCode);
    }

    @Transactional
    public void deleteUser(Long userId, String adminActor) {
        adminDAO.deleteUser(userId);
    }

    // ==========================================
    // 일괄 작업 (Batch Operations)
    // ==========================================
    @Transactional
    public void bulkUpdateUserStatus(List<Long> userIds, String status, String adminActor) {
        adminDAO.bulkUpdateUserStatus(userIds, status);
    }

    // ==========================================
    // 사용자 피드백 관리
    // ==========================================
    public List<FeedbackDTO> findFeedbacks(String status) {
        return adminDAO.selectFeedbacks(status);
    }

    public FeedbackDTO getFeedbackDetail(Long supportId) {
        return adminDAO.selectFeedbackById(supportId);
    }

    @Transactional
    public void changeFeedbackStatus(Long supportId, String status, String adminActor) {
        adminDAO.updateFeedbackStatus(supportId, status);
    }

    @Transactional
    public void deleteFeedback(Long supportId, String adminActor) {
        adminDAO.deleteFeedback(supportId);
    }

    // ==========================================
    // 문의 답변 작성 (SUPPORT_ANSWER)
    // ==========================================
    @Transactional
    public void answerSupportTicket(Long supportId, String content) {
        adminDAO.insertSupportAnswer(supportId, content);
        // 답변 작성 완료 처리
        adminDAO.updateFeedbackStatus(supportId, "DONE");
    }

}
