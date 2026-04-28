package kr.hi.matey.controller;

import kr.hi.matey.dto.FeedbackDTO;
import kr.hi.matey.dto.UserDTO2;
import kr.hi.matey.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    // ==========================================
    // 대시보드 & 통계
    // ==========================================
    
    @GetMapping("/dashboard/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(adminService.getDashboardData());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/stats/emotions")
    public ResponseEntity<List<Map<String, Object>>> getEmotionStats() {
        return ResponseEntity.ok(adminService.getEmotionStats());
    }

    @GetMapping("/stats/concerns")
    public ResponseEntity<List<Map<String, Object>>> getConcernStats() {
        return ResponseEntity.ok(adminService.getConcernStats());
    }

    // ==========================================
    // 사용자 관리
    // ==========================================

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO2>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findUsers(keyword, role, status));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<Void> updateUser(@PathVariable Long userId, @RequestBody Map<String, Object> body) {
        adminService.updateUser(userId, body);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<Void> updateRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        adminService.updateUserRole(userId, body.get("role"));
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // 피드백 관리
    // ==========================================

    @GetMapping("/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> getFeedbacks(@RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findFeedbacks(status));
    }

    @PatchMapping("/feedbacks/{feedbackId}/status")
    public ResponseEntity<Void> updateFeedbackStatus(
            @PathVariable Long feedbackId, 
            @RequestBody Map<String, String> body) {
        adminService.changeFeedbackStatus(feedbackId, body.get("status"));
        return ResponseEntity.ok().build();
    }

    // ==========================================
    // 활동 로그
    // ==========================================

    @GetMapping("/logs")
    public ResponseEntity<List<Map<String, Object>>> getLogs(
            @RequestParam(defaultValue = "ALL") String period,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String category,
            @RequestParam(defaultValue = "ALL") String actor) {
        return ResponseEntity.ok(adminService.findLogs(period, keyword, category, actor));
    }
}