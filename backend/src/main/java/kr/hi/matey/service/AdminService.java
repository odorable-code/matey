package kr.hi.matey.service;

import kr.hi.matey.dao.AdminDAO;
import kr.hi.matey.dto.AdminBotStatsRow;
import kr.hi.matey.dto.AdminBotUpsertDTO;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import kr.hi.matey.util.RoleCodeHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    private static final Map<String, String> DEFAULT_DISPLAY_BY_BOT_KEY =
            Map.of("dog", "강이", "bear", "곰이", "cat", "냥이");
    private static final ObjectMapper JSON_MAPPER = new ObjectMapper();
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
     * 대시보드 트렌드: 활성 사용자 추이 + 채팅 세션 추이.
     * 각 시리즈는 label(시각) + value(건수) 맵 리스트로 반환됩니다.
     */
    public Map<String, Object> getDashboardTrends() {
        Map<String, Object> result = new HashMap<>();
        result.put("activeUserTrend", adminDAO.selectActiveUserTrend());
        result.put("chatSessionTrend", adminDAO.selectChatSessionTrend());
        return result;
    }

    /**
     * 상담봇 관리 탭: 전월(직전 달) 기준 순위 + 누적 좋/싫 + 전월 추천·싫어요 이벤트 건수.
     * 공개 랭킹과 동일하게, 그 달 이벤트가 하나도 없으면 순위는 BOT.like_count 기준입니다.
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
            String disp = r.getDisplayName() != null ? r.getDisplayName().trim() : "";
            if (disp.isEmpty()) {
                String n = r.getName() != null ? r.getName().trim().toLowerCase(Locale.ROOT) : "";
                disp = DEFAULT_DISPLAY_BY_BOT_KEY.getOrDefault(n, "");
            }
            if (disp.isEmpty()) {
                disp = r.getName() != null ? r.getName().trim() : "";
            }
            item.put("displayName", disp);
            item.put("description", r.getDescription());
            item.put("selectionPreview", r.getSelectionPreview());
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
            item.put("cardStatsJson", r.getCardStatsJson());
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

    /**
     * 상담봇 신규 등록 (BOT). 누적 좋아요·싫어요는 0으로 시작합니다.
     */
    @Transactional
    public long createBot(Map<String, Object> body) {
        AdminBotUpsertDTO dto = buildBotWriteFromMap(body, null);
        normalizeBotWrite(dto);
        adminDAO.insertBot(dto);
        if (dto.getBotId() == null || dto.getBotId() <= 0) {
            throw new IllegalStateException("봇 등록에 실패했어요.");
        }
        return dto.getBotId();
    }

    /**
     * 상담봇 프로필 수정 (이름·이미지·설명·선택 미리보기).
     */
    @Transactional
    public void updateBot(long botId, Map<String, Object> body) {
        if (adminDAO.countBotById(botId) == 0) {
            throw new IllegalArgumentException("해당 봇을 찾을 수 없어요.");
        }
        AdminBotUpsertDTO dto = buildBotWriteFromMap(body, botId);
        normalizeBotWrite(dto);
        int n = adminDAO.updateBot(dto);
        if (n != 1) {
            throw new IllegalStateException("봇 수정에 실패했어요.");
        }
    }

    private static AdminBotUpsertDTO buildBotWriteFromMap(Map<String, Object> body, Long botIdForUpdate) {
        Map<String, Object> b = body != null ? body : Map.of();
        AdminBotUpsertDTO dto = new AdminBotUpsertDTO();
        if (botIdForUpdate != null) {
            dto.setBotId(botIdForUpdate);
        }
        dto.setName(trimToNull(b.get("name")));
        String dname = trimToNull(b.get("displayName"));
        if (dname == null) {
            dname = trimToNull(b.get("display_name"));
        }
        dto.setDisplayName(dname);
        String av = trimToNull(b.get("avatarImage"));
        if (av == null) {
            av = trimToNull(b.get("avatar_image"));
        }
        dto.setAvatarImage(av == null ? null : clamp(av, 8000));
        String desc = trimToNull(b.get("description"));
        dto.setDescription(desc == null ? null : clamp(desc, 8000));
        String prev = trimToNull(b.get("selectionPreview"));
        if (prev == null) {
            prev = trimToNull(b.get("selection_preview"));
        }
        dto.setSelectionPreview(prev != null ? clamp(prev, 8000) : "");
        String csj = trimToNull(b.get("cardStatsJson"));
        if (csj == null) {
            csj = trimToNull(b.get("card_stats_json"));
        }
        dto.setCardStatsJson(csj);
        return dto;
    }

    private static void normalizeBotWrite(AdminBotUpsertDTO dto) {
        String name = dto.getName();
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("시스템 키(영문 식별자)를 입력해 주세요. 예: dog, bear, cat");
        }
        name = name.trim().toLowerCase(Locale.ROOT);
        if (name.length() > 50) {
            throw new IllegalArgumentException("시스템 키는 50자 이내로 입력해 주세요.");
        }
        dto.setName(name);

        String disp = trimToNull(dto.getDisplayName());
        if (disp == null) {
            disp = DEFAULT_DISPLAY_BY_BOT_KEY.get(name);
        }
        if (disp == null) {
            disp = name;
        }
        disp = disp.trim();
        if (disp.length() > 50) {
            throw new IllegalArgumentException("화면에 보일 이름은 50자 이내로 입력해 주세요.");
        }
        dto.setDisplayName(disp);

        String preview = dto.getSelectionPreview();
        if (preview == null || preview.isBlank()) {
            String d = dto.getDescription();
            preview = (d != null && !d.isBlank()) ? d.trim() : dto.getDisplayName() + " 상담봇";
        } else {
            preview = preview.trim();
        }
        dto.setSelectionPreview(clamp(preview, 8000));
        normalizeCardStatsJson(dto);
    }

    /**
     * 능력치 막대용 JSON: [{"label":"공감력","value":92}, …] — 1~8개, value 0~100.
     */
    private static void normalizeCardStatsJson(AdminBotUpsertDTO dto) {
        String raw = dto.getCardStatsJson();
        if (raw == null || raw.isBlank()) {
            dto.setCardStatsJson(null);
            return;
        }
        raw = raw.trim();
        if (raw.length() > 4000) {
            throw new IllegalArgumentException("능력치 정보가 너무 길어요.");
        }
        try {
            JsonNode root = JSON_MAPPER.readTree(raw);
            if (!root.isArray()) {
                throw new IllegalArgumentException("능력치는 JSON 배열 형식이어야 해요.");
            }
            int n = root.size();
            if (n < 1 || n > 8) {
                throw new IllegalArgumentException("능력치는 1~8개 항목이어야 해요.");
            }
            for (JsonNode el : root) {
                if (el == null || !el.isObject()) {
                    throw new IllegalArgumentException("능력치 항목 형식이 올바르지 않아요.");
                }
                JsonNode lb = el.get("label");
                JsonNode vb = el.get("value");
                if (lb == null || !lb.isTextual()) {
                    throw new IllegalArgumentException("각 항목에 label(문자열)이 필요해요.");
                }
                String label = lb.asText().trim();
                if (label.isEmpty() || label.length() > 30) {
                    throw new IllegalArgumentException("능력치 이름(label)은 1~30자로 입력해 주세요.");
                }
                if (vb == null || !vb.isNumber()) {
                    throw new IllegalArgumentException("각 항목에 value(숫자)가 필요해요.");
                }
                int v = vb.intValue();
                if (v < 0 || v > 100) {
                    throw new IllegalArgumentException("능력치 수치는 0~100 사이로 입력해 주세요.");
                }
            }
            dto.setCardStatsJson(JSON_MAPPER.writeValueAsString(root));
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("능력치 JSON 형식이 올바르지 않아요.");
        }
    }

    private static String trimToNull(Object o) {
        if (o == null) {
            return null;
        }
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private static String clamp(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
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
                notificationService.notifySupportAnswer(ticketOwnerId, supportId, notiContent, isUpdate);
            } catch (RuntimeException ignored) {
                // 알림 실패는 답변 저장 성공과 분리
            }
        }
        return isUpdate;
    }

}
