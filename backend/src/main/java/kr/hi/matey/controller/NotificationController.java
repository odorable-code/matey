package kr.hi.matey.controller;

import kr.hi.matey.dto.NotificationDTO;
import kr.hi.matey.service.NotificationService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(notificationService.getNotifications(user.getUser().getUserId()));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable("notificationId") Long notificationId) {
        notificationService.markAsRead(user.getUser().getUserId(), notificationId);
        return ResponseEntity.ok(Map.of("message", "읽음 처리되었습니다."));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal CustomUser user) {
        notificationService.markAllAsRead(user.getUser().getUserId());
        return ResponseEntity.ok(Map.of("message", "전체 읽음 처리되었습니다."));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable("notificationId") Long notificationId) {
        notificationService.deleteNotification(user.getUser().getUserId(), notificationId);
        return ResponseEntity.ok(Map.of("message", "알림이 삭제되었습니다."));
    }
}
