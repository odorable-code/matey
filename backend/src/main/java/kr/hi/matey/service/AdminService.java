package kr.hi.matey.service;

import kr.hi.matey.dao.AdminDAO;
import kr.hi.matey.dto.AdminBotStatsRow;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import kr.hi.matey.util.RoleCodeHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    private final AdminDAO adminDAO;
    private final NotificationService notificationService;

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

    /**
     * 상담봇 관리 탭: 전월 기준 순위 + 누적 좋/싫 + 전월 추천·싫어요 이벤트 건수.
     * 공개 랭킹과 동일하게, 해당 월 이벤트가 하나도 없으면 순위는 BOT.like_count 기준입니다.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getBotManagementStats() {
        YearMonth ym = YearMonth.now().minusMonths(1);
        int y = ym.getYear();
        int m = ym.getMonthValue();

        List<AdminBotStatsRow> rows;
        try {
            rows = adminDAO.selectBotsWithPrevMonthBreakdown(y, m);
        } catch (DataAccessException ex) {
            log.warn("getBotManagementStats (bots join): {}", ex.getMessage());
            rows = List.of();
        }
        if (rows == null) {
            rows = List.of();
        }

        long eventCount = 0;
        try {
            eventCount = adminDAO.countRecommendEventsInMonth(y, m);
        } catch (DataAccessException ex) {
            log.warn("getBotManagementStats (count events): {}", ex.getMessage());
            eventCount = 0;
        }

        boolean useEventRanking = eventCount > 0;

        List<AdminBotStatsRow> sorted = new ArrayList<>(rows);
        Comparator<AdminBotStatsRow> cmp =
                useEventRanking
                        ? Comparator.<AdminBotStatsRow>comparingInt(
                                        r -> r.getPrevMonthNet() != null ? r.getPrevMonthNet() : 0)
                                .reversed()
                                .thenComparingLong(AdminBotStatsRow::getBotId)
                        : Comparator.<AdminBotStatsRow>comparingInt(
                                        r -> r.getLikeCount() != null ? r.getLikeCount() : 0)
                                .reversed()
                                .thenComparingLong(AdminBotStatsRow::getBotId);
        sorted.sort(cmp);

        List<Map<String, Object>> bots = new ArrayList<>();
        int rank = 1;
        for (AdminBotStatsRow r : sorted) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("botId", r.getBotId());
            item.put("name", r.getName());
            item.put("description", r.getDescription());
            item.put("avatarImage", r.getAvatarImage());
            item.put("cumulativeLikeCount", r.getLikeCount());
            item.put("cumulativeDislikeCount", r.getDislikeCount());
            item.put("prevMonthYear", y);
            item.put("prevMonthMonth", m);
            item.put("prevMonthRecommendEvents", r.getPrevMonthRecommendCount());
            item.put("prevMonthDislikeEvents", r.getPrevMonthDislikeCount());
            item.put("prevMonthNetScore", r.getPrevMonthNet());
            item.put("prevMonthRank", rank++);
            item.put(
                    "rankingMode",
                    useEventRanking ? "BOT_RECOMMEND_EVENT_MONTHLY" : "BOT_LIKE_COUNT"
            );
            bots.add(item);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("periodYear", y);
        res.put("periodMonth", m);
        res.put("periodLabel", y + "년 " + m + "월");
        res.put(
                "rankingSource",
                useEventRanking ? "BOT_RECOMMEND_EVENT_MONTHLY" : "BOT_LIKE_COUNT"
        );
        res.put("bots", bots);
        return res;
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
        assertMayAssignRole(userId, roleCode);
        adminDAO.updateUserRole(userId, roleCode);
    }

    /**
     * 총관리자(ADMIN/SUPER_ADMIN) 권한은 기존에 해당 권한이 있는 계정 외에는 부여할 수 없습니다.
     */
    private void assertMayAssignRole(Long targetUserId, String newRoleCode) {
        String desired = RoleCodeHelper.normalize(newRoleCode);
        if (!"ADMIN".equals(desired) && !"SUPER_ADMIN".equals(desired)) {
            return;
        }
        UserDTO2 current = adminDAO.selectUserById(targetUserId);
        if (current == null) {
            throw new IllegalArgumentException("대상 사용자를 찾을 수 없습니다.");
        }
        String cur = RoleCodeHelper.normalize(current.getRoleName());
        if (!"ADMIN".equals(cur) && !"SUPER_ADMIN".equals(cur)) {
            throw new IllegalArgumentException("총관리자 권한은 다른 계정에 부여할 수 없습니다.");
        }
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

    @Transactional
    public void bulkUpdateUserRole(List<Long> userIds, String roleCode, String adminActor) {
        if (userIds != null) {
            for (Long uid : userIds) {
                assertMayAssignRole(uid, roleCode);
            }
        }
        adminDAO.bulkUpdateUserRole(userIds, roleCode);
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
    /**
     * @return true 이면 기존 답변이 있던 티켓에 추가된 경우(알림·API 문구는 '수정'에 맞춤)
     */
    @Transactional
    public boolean answerSupportTicket(Long supportId, String content, Long adminUserId) {
        int existingAnswers = adminDAO.countSupportAnswersBySupportId(supportId);
        boolean isUpdate = existingAnswers > 0;

        adminDAO.insertSupportAnswer(supportId, content, adminUserId);
        adminDAO.updateFeedbackStatus(supportId, "DONE");

        Long ticketOwnerId = adminDAO.selectSupportUserId(supportId);
        if (ticketOwnerId != null) {
            String titleLine = isUpdate
                    ? "신고/문의 답변이 수정되었습니다"
                    : "신고/문의 답변이 등록되었습니다";
            String bodyLine = isUpdate
                    ? "접수하신 문의·신고 답변이 수정되었어요. 마이페이지에서 확인해 주세요."
                    : "접수하신 문의·신고에 답변이 등록되었어요. 마이페이지에서 확인해 주세요.";
            String notiContent = titleLine + "\n" + bodyLine;
            try {
                notificationService.createNotification(
                        ticketOwnerId,
                        "SUPPORT_ANSWER",
                        notiContent,
                        "SUPPORT",
                        supportId
                );
            } catch (RuntimeException ignored) {
                // 알림 실패는 답변 저장 성공과 분리
            }
        }
        return isUpdate;
    }

}
