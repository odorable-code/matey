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

    @GetMapping("/dashboard/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(adminService.getDashboardData());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO2>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findUsers(keyword, role, status));
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<Void> updateRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        adminService.updateUserRole(userId, body.get("role"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/feedbacks")
    public ResponseEntity<List<FeedbackDTO>> getFeedbacks(@RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.findFeedbacks(status));
    }
}