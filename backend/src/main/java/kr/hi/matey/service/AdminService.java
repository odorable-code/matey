package kr.hi.matey.service;

import kr.hi.matey.dao.AdminDAO;
import kr.hi.matey.dto.AdminLogDTO;
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
        
        // Log
        AdminLogDTO log = new AdminLogDTO();
        log.setActor(adminActor);
        log.setActorRole("ADMIN");
        log.setCategory("USER_MGMT");
        log.setAction("UPDATE");
        log.setTarget("User ID: " + userId);
        log.setDetail("Updated fields: " + data.keySet().toString());
        adminDAO.insertAdminLog(log);
    }

    @Transactional
    public void updateUserRole(Long userId, String roleCode, String adminActor) {
        adminDAO.updateUserRole(userId, roleCode);

        // Log
        AdminLogDTO log = new AdminLogDTO();
        log.setActor(adminActor);
        log.setActorRole("SUPER_ADMIN");
        log.setCategory("ROLE_MGMT");
        log.setAction("UPDATE");
        log.setTarget("User ID: " + userId);
        log.setDetail("Role changed to " + roleCode);
        adminDAO.insertAdminLog(log);
    }

    @Transactional
    public void deleteUser(Long userId, String adminActor) {
        adminDAO.deleteUser(userId);

        // Log
        AdminLogDTO log = new AdminLogDTO();
        log.setActor(adminActor);
        log.setActorRole("ADMIN");
        log.setCategory("USER_MGMT");
        log.setAction("DELETE");
        log.setTarget("User ID: " + userId);
        log.setDetail("User soft deleted.");
        adminDAO.insertAdminLog(log);
    }

    // ==========================================
    // 일괄 작업 (Batch Operations)
    // ==========================================
    @Transactional
    public void bulkUpdateUserStatus(List<Long> userIds, String status, String adminActor) {
        adminDAO.bulkUpdateUserStatus(userIds, status);

        // Log
        AdminLogDTO log = new AdminLogDTO();
        log.setActor(adminActor);
        log.setActorRole("ADMIN");
        log.setCategory("USER_MGMT");
        log.setAction("BULK_UPDATE");
        log.setTarget(userIds.size() + " Users");
        log.setDetail("Batch updated status to " + status);
        adminDAO.insertAdminLog(log);
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

        // Log
        AdminLogDTO log = new AdminLogDTO();
        log.setActor(adminActor);
        log.setActorRole("ADMIN");
        log.setCategory("FEEDBACK_MGMT");
        log.setAction("UPDATE");
        log.setTarget("Support ID: " + supportId);
        log.setDetail("Feedback status changed to " + status);
        adminDAO.insertAdminLog(log);
    }

    @Transactional
    public void deleteFeedback(Long supportId, String adminActor) {
        adminDAO.deleteFeedback(supportId);

        // Log
        AdminLogDTO log = new AdminLogDTO();
        log.setActor(adminActor);
        log.setActorRole("ADMIN");
        log.setCategory("FEEDBACK_MGMT");
        log.setAction("DELETE");
        log.setTarget("Support ID: " + supportId);
        log.setDetail("Feedback deleted permanently.");
        adminDAO.insertAdminLog(log);
    }

    // ==========================================
    // 관리자 활동 로그
    // ==========================================
    public List<AdminLogDTO> findLogs(String period, String keyword, String category, String actor) {
        return adminDAO.selectAdminLogs(period, keyword, category, actor);
    }

    @Transactional
    public void createLog(AdminLogDTO log) {
        adminDAO.insertAdminLog(log);
    }
}
