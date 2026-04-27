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

    // 1. 사용자 검색 및 목록
    public List<UserDTO2> findUsers(String keyword, String role, String status) {
        return adminMapper.selectAdminUserList(keyword, role, status);
    }

    // 2. 사용자 권한 및 상태 변경 (일괄 처리 포함)
    @Transactional
    public void bulkUpdateStatus(List<Long> userIds, String status) {
        userIds.forEach(id -> adminMapper.updateUserStatus(id, status));
    }

    @Transactional
    public void updateUserRole(Long userId, String roleCode) {
        Long roleId = adminMapper.selectRoleIdByCode(roleCode);
        adminMapper.updateUserRole(userId, roleId);
    }

    // 3. 피드백 관리
    public List<FeedbackDTO> findFeedbacks(String status) {
        return adminMapper.selectSupportList(status);
    }

    @Transactional
    public void changeFeedbackStatus(Long supportId, String status) {
        adminMapper.updateSupportStatus(supportId, status);
    }

    // 4. 대시보드 통계 데이터 통합
    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();
        data.put("summary", adminMapper.selectSummaryCounts());
        data.put("emotionStats", adminMapper.selectEmotionStats());
        data.put("concernStats", adminMapper.selectCategoryStats());
        return data;
    }
}