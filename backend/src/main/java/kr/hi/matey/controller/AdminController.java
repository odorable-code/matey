package kr.hi.matey.controller;

import kr.hi.matey.dto.AdminBatchRequestDTO;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import kr.hi.matey.dto.WorrySpotlightPublishRequest;
import kr.hi.matey.service.AdminService;
import kr.hi.matey.service.CommunityService;
import kr.hi.matey.service.SupportService;
import kr.hi.matey.service.NoticeService;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.util.RoleCodeHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;
    private final SupportService supportService;
    private final NoticeService noticeService;
    private final CommunityService communityService;

    // ==========================================
    // 실시간 운영 통계 및 지표
    //    // ==========================================

    @GetMapping("/dashboard/overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        return ResponseEntity.ok(adminService.getDashboardOverview());
    }

    @GetMapping("/dashboard/live")
    public ResponseEntity<List<Map<String, Object>>> getLiveMetrics() {
        return ResponseEntity.ok(adminService.getLiveMetrics());
    }

    /** 상담봇 관리 탭: 누적 좋/싫 + 전월 추천 이벤트·순위 */
    @GetMapping("/bots/stats")
    public ResponseEntity<Map<String, Object>> getBotManagementStats(
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(adminService.getBotManagementStats());
    }

    /** 상담봇 신규 등록 */
    @PostMapping("/bots")
    public ResponseEntity<?> createBot(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "권한이 없습니다."));
        }
        try {
            long id = adminService.createBot(body);
            return ResponseEntity.ok(Map.of("botId", id, "message", "상담봇이 등록되었습니다."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", ex.getMessage()));
        }
    }

    /** 상담봇 프로필 수정 */
    @PutMapping("/bots/{botId}")
    public ResponseEntity<?> updateBot(
            @PathVariable("botId") long botId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "권한이 없습니다."));
        }
        try {
            adminService.updateBot(botId, body);
            return ResponseEntity.ok(Map.of("message", "저장되었습니다."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", ex.getMessage()));
        }
    }

    // ==========================================
    // 사용자 관리 (검색, 필터, CRUD)
    // ==========================================

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO2>> getUsers(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "role", defaultValue = "ALL") String role,
            @RequestParam(name = "status", defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findUsers(keyword, role, status));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDTO2> getUserDetail(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(adminService.getUserDetail(userId));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<String> updateUser(
            @PathVariable("userId") Long userId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUser user) {
        String adminID = user.getUsername();
        adminService.updateUser(userId, body, adminID);
        return ResponseEntity.ok("사용자 정보가 수정되었습니다.");
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<String> updateUserRole(
            @PathVariable("userId") Long userId, 
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUser user) {
        if (!RoleCodeHelper.isSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        String adminID = user.getUsername();
        try {
            adminService.updateUserRole(userId, body.get("roleCode"), adminID);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
        return ResponseEntity.ok("사용자 권한이 수정되었습니다.");
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<String> deleteUser(
            @PathVariable("userId") Long userId,
            @AuthenticationPrincipal CustomUser user
    ) {
        String adminID = user.getUsername();
        adminService.deleteUser(userId, adminID);
        return ResponseEntity.ok("사용자가 탈퇴(정지) 처리되었습니다.");
    }

    // ==========================================
    // 일괄 작업 (Batch Operations)
    // ==========================================

    @PostMapping("/users/batch/status")
    public ResponseEntity<String> bulkUpdateStatus(
            @RequestBody AdminBatchRequestDTO request,
            @AuthenticationPrincipal CustomUser user) {
        String adminID = user.getUsername();
        adminService.bulkUpdateUserStatus(request.getUserIds(), request.getStatus(), adminID);
        return ResponseEntity.ok("일괄 처리가 완료되었습니다.");
    }

    @PostMapping("/users/batch/role")
    public ResponseEntity<String> bulkUpdateRole(
            @RequestBody AdminBatchRequestDTO request,
            @AuthenticationPrincipal CustomUser user) {
        if (!RoleCodeHelper.isSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        String adminID = user.getUsername();
        try {
            adminService.bulkUpdateUserRole(request.getUserIds(), request.getRoleCode(), adminID);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
        return ResponseEntity.ok("일괄 권한 변경이 완료되었습니다.");
    }

    // ==========================================
    // 피드백 관리
    // ==========================================

    @GetMapping("/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> getFeedbacks(
            @RequestParam(name = "status", defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findFeedbacks(status));
    }

    @GetMapping("/feedbacks/{supportId}")
    public ResponseEntity<FeedbackDTO> getFeedbackDetail(@PathVariable("supportId") Long supportId) {
        return ResponseEntity.ok(adminService.getFeedbackDetail(supportId));
    }

    @PatchMapping("/feedbacks/{supportId}/status")
    public ResponseEntity<String> updateFeedbackStatus(
            @PathVariable("supportId") Long supportId, 
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUser user
    ) {
        String adminID = user.getUsername();
        adminService.changeFeedbackStatus(supportId, body.get("status"), adminID);
        return ResponseEntity.ok("피드백 상태가 변경되었습니다.");
    }

    @DeleteMapping("/feedbacks/{supportId}")
    public ResponseEntity<String> deleteFeedback(
            @PathVariable("supportId") Long supportId,
            @AuthenticationPrincipal CustomUser user
    ) {
        String adminID = user.getUsername();
        adminService.deleteFeedback(supportId, adminID);
        return ResponseEntity.ok("피드백이 삭제되었습니다.");
    }

    // ==========================================
    // FAQ 관리 (ADMIN 전용)
    // ==========================================

    @GetMapping("/faqs")
    public ResponseEntity<?> getFaqs() {
        return ResponseEntity.ok(supportService.getFaqList());
    }

    @PostMapping("/faqs")
    public ResponseEntity<String> createFaq(
            @RequestBody kr.hi.matey.dto.FaqDTO faqDTO,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isCommunityStaffPublisher(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        Long roleId = user.getUser().getRoleId();
        if (roleId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("역할 정보가 없어 FAQ를 등록할 수 없습니다.");
        }
        faqDTO.setRoleId(roleId);
        supportService.createFaq(faqDTO);
        return ResponseEntity.ok("FAQ가 등록되었습니다.");
    }

    @PutMapping("/faqs/{faqId}")
    public ResponseEntity<String> updateFaq(
            @PathVariable("faqId") Long faqId,
            @RequestBody kr.hi.matey.dto.FaqDTO faqDTO,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isCommunityStaffPublisher(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        faqDTO.setFaqId(faqId);
        supportService.updateFaq(faqDTO);
        return ResponseEntity.ok("FAQ가 수정되었습니다.");
    }

    // ==========================================
    // 문의 답변 작성 (ADMIN 전용)
    // ==========================================

    @PostMapping("/feedbacks/{supportId}/answer")
    public ResponseEntity<String> answerFeedback(
            @PathVariable("supportId") Long supportId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("답변 내용을 입력해 주세요.");
        }

        if (user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("관리자 정보가 없어 답변을 등록할 수 없습니다.");
        }
        long adminUserId = user.getUser().getUserId();
        if (adminUserId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("관리자 계정 식별에 실패했어요. 다시 로그인해 주세요.");
        }

        boolean updated = adminService.answerSupportTicket(supportId, content.trim(), adminUserId);
        return ResponseEntity.ok(updated ? "답변이 수정되었습니다." : "답변이 등록되었습니다.");
    }

    // ==========================================
    // 공지사항 관리 (ADMIN 전용)
    // ==========================================

    @PostMapping("/notices")
    public ResponseEntity<String> createNotice(
            @RequestBody kr.hi.matey.dto.AdminNoticeDTO dto,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        noticeService.createNotice(dto);
        return ResponseEntity.ok("공지사항이 등록되었습니다.");
    }

    @PutMapping("/notices/{noticeId}")
    public ResponseEntity<String> updateNotice(
            @PathVariable("noticeId") Long noticeId,
            @RequestBody kr.hi.matey.dto.AdminNoticeDTO dto,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        dto.setNoticeId(noticeId);
        noticeService.updateNotice(dto);
        return ResponseEntity.ok("공지사항이 수정되었습니다.");
    }

    // ==========================================
    // 고민 스포트라이트 (커뮤니티 상단 노출)
    // ==========================================

    /** 고민 글 무작위 추첨 후 미리보기(저장 전) */
    @PostMapping("/community/worry-spotlight/draw")
    public ResponseEntity<Map<String, Object>> drawWorrySpotlightCandidate(
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(communityService.drawRandomWorryPost(user.getUser().getUserId()));
    }

    /** 추첨 글 + 운영 답변 공개 */
    @PutMapping("/community/worry-spotlight")
    public ResponseEntity<Map<String, Object>> publishWorrySpotlight(
            @RequestBody WorrySpotlightPublishRequest body,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (body == null || body.getPostId() == null) {
            return ResponseEntity.badRequest().build();
        }
        communityService.publishWorrySpotlight(
                body.getPostId(),
                body.getAnswerContent(),
                user.getUser().getUserId()
        );
        return ResponseEntity.ok(communityService.getWorryFeatured(user.getUser().getUserId()));
    }
}
