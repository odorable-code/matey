package kr.hi.matey.controller;

import kr.hi.matey.dto.AdminBatchRequestDTO;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import kr.hi.matey.service.AdminService;
import kr.hi.matey.service.SupportService;
import kr.hi.matey.service.NoticeService;
import kr.hi.matey.util.CustomUser;
import kr.hi.matey.util.RoleCodeHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.AutoConfiguration;
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

    // ==========================================
    // 사용자 관리 (검색, 필터, CRUD)
    // ==========================================

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO2>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findUsers(keyword, role, status));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDTO2> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getUserDetail(userId));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<String> updateUser(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUser user) {
        String adminID = user.getUsername();
        adminService.updateUser(userId, body, adminID);
        return ResponseEntity.ok("사용자 정보가 수정되었습니다.");
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<String> updateUserRole(
            @PathVariable Long userId, 
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUser user) {
        if (!RoleCodeHelper.isSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        String adminID = user.getUsername();
        adminService.updateUserRole(userId, body.get("roleCode"), adminID);
        return ResponseEntity.ok("사용자 권한이 수정되었습니다.");
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<String> deleteUser(
            @PathVariable Long userId,
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

    // ==========================================
    // 피드백 관리
    // ==========================================

    @GetMapping("/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> getFeedbacks(@RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findFeedbacks(status));
    }

    @GetMapping("/feedbacks/{supportId}")
    public ResponseEntity<FeedbackDTO> getFeedbackDetail(@PathVariable Long supportId) {
        return ResponseEntity.ok(adminService.getFeedbackDetail(supportId));
    }

    @PatchMapping("/feedbacks/{supportId}/status")
    public ResponseEntity<String> updateFeedbackStatus(
            @PathVariable Long supportId, 
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUser user
    ) {
        String adminID = user.getUsername();
        adminService.changeFeedbackStatus(supportId, body.get("status"), adminID);
        return ResponseEntity.ok("피드백 상태가 변경되었습니다.");
    }

    @DeleteMapping("/feedbacks/{supportId}")
    public ResponseEntity<String> deleteFeedback(
            @PathVariable Long supportId,
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
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        supportService.createFaq(faqDTO);
        return ResponseEntity.ok("FAQ가 등록되었습니다.");
    }

    @PutMapping("/faqs/{faqId}")
    public ResponseEntity<String> updateFaq(
            @PathVariable Long faqId,
            @RequestBody kr.hi.matey.dto.FaqDTO faqDTO,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
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
            @PathVariable Long supportId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUser user
    ) {
        if (!RoleCodeHelper.isAdminOrSuperAdmin(user.getUser().getRoleCode())) {
            return ResponseEntity.status(403).body("forbidden");
        }

        String content = body.get("content");
        String handlingMethod = body.get("handlingMethod");
        adminService.answerSupportTicket(supportId, content, handlingMethod, user.getUser().getUserId());
        return ResponseEntity.ok("답변이 등록되었습니다.");
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
            @PathVariable Long noticeId,
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
}
