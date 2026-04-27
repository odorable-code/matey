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
    private final AdminDAO adminMapper;

    // ==========================================
    // 통계 & 대시보드
    // ==========================================

    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();
        data.put("summary", adminMapper.selectSummaryCounts());
        data.put("emotionStats", adminMapper.selectEmotionStats());
        data.put("concernStats", adminMapper.selectCategoryStats());
        return data;
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("summary", adminMapper.selectSummaryCounts());
        stats.put("userCount", adminMapper.selectUserCount());
        stats.put("activeConversations", adminMapper.selectActiveConversationCount());
        stats.put("avgAttendance", adminMapper.selectAvgAttendance());
        return stats;
    }

    public List<Map<String, Object>> getEmotionStats() {
        return adminMapper.selectEmotionStats();
    }

    public List<Map<String, Object>> getConcernStats() {
        return adminMapper.selectCategoryStats();
    }

    // ==========================================
    // 사용자 관리
    // ==========================================

    public List<UserDTO2> findUsers(String keyword, String role, String status) {
        return adminMapper.selectAdminUserList(keyword, role, status);
    }

    @Transactional
    public void updateUser(Long userId, Map<String, Object> data) {
        if (data.containsKey("status")) {
            adminMapper.updateUserStatus(userId, (String) data.get("status"));
        }
        if (data.containsKey("nickname")) {
            adminMapper.updateUserNickname(userId, (String) data.get("nickname"));
        }
    }

    @Transactional
    public void deleteUser(Long userId) {
        adminMapper.deleteUser(userId);
    }

    @Transactional
    public void bulkUpdateStatus(List<Long> userIds, String status) {
        userIds.forEach(id -> adminMapper.updateUserStatus(id, status));
    }

    @Transactional
    public void updateUserRole(Long userId, String roleCode) {
        Long roleId = adminMapper.selectRoleIdByCode(roleCode);
        adminMapper.updateUserRole(userId, roleId);
    }

    // ==========================================
    // 피드백 관리
    // ==========================================

    public List<FeedbackDTO> findFeedbacks(String status) {
        return adminMapper.selectSupportList(status);
    }

    @Transactional
    public void changeFeedbackStatus(Long supportId, String status) {
        adminMapper.updateSupportStatus(supportId, status);
    }

    // ==========================================
    // 활동 로그
    // ==========================================

    public List<Map<String, Object>> findLogs(String period, String keyword, String category, String actor) {
        return adminMapper.selectAdminActivityLogs(keyword, period, category, actor);
    }

    @Transactional
    public void insertLog(Map<String, Object> log) {
        adminMapper.insertAdminLog(log);
    }
}