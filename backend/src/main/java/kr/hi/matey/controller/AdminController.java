package kr.hi.matey.controller;

import kr.hi.matey.dto.AdminBatchRequestDTO;
import kr.hi.matey.dto.AdminLogDTO;
import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import kr.hi.matey.service.AdminService;
import kr.hi.matey.util.CustomUser;
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

    // ==========================================
    // 실시간 운영 통계 및 지표
    // ==========================================
    
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
    // 관리자 활동 로그
    // ==========================================

    @GetMapping("/logs")
    public ResponseEntity<List<AdminLogDTO>> getLogs(
            @RequestParam(defaultValue = "ALL") String period,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String category,
            @RequestParam(defaultValue = "ALL") String actor) {
        return ResponseEntity.ok(adminService.findLogs(period, keyword, category, actor));
    }

    @PostMapping("/logs")
    public ResponseEntity<String> createLog(
            @RequestBody AdminLogDTO log,
            @AuthenticationPrincipal CustomUser user
    ) {
        // 클라이언트에서 직접 로그를 남기는 경우 (보통은 Service 레이어에서 AOP 등을 통해 처리)
        String adminID = user.getUsername();
        log.setActor(adminID);
        adminService.createLog(log);
        return ResponseEntity.ok("로그가 기록되었습니다.");
    }
}
