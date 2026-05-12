package kr.hi.matey.controller;

import kr.hi.matey.dto.*;
import kr.hi.matey.service.MyPageService;
import kr.hi.matey.util.CustomUser; // 기존 사용하시던 시큐리티 객체 가정
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(myPageService.getUserProfile(user.getUser().getUserId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody ProfileUpdateDTO updateDTO) {
        myPageService.updateUserProfile(user.getUser().getUserId(), updateDTO);
        return ResponseEntity.ok(Map.of("message", "프로필이 수정되었습니다."));
    }

    @GetMapping("/bot-menu")
    public ResponseEntity<BotMenuDTO> getBotMenu(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(myPageService.getBotMenuData(user.getUser().getUserId()));
    }

    /**
     * 메인·커뮤니티의 GET /api/community/bots/landing 과 동일 BOT 목록 (로그인 필요).
     * 일부 배포/프록시에서 /api/community/** 만 막혀 있을 때 마이페이지 네임스페이스로 조회할 수 있게 둠.
     */
    @GetMapping("/bots/landing")
    public ResponseEntity<List<AssignableBotOption>> getBotsLandingMirror(@AuthenticationPrincipal CustomUser user) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(myPageService.listAssignableBotsForPicker());
    }

    /** 담당봇 픽커용 BOT 전체 목록 (GET /api/community/bots/landing 과 동일 쿼리, 로그인 필요) */
    @GetMapping("/bots/assignable")
    public ResponseEntity<List<AssignableBotOption>> getAssignableBots(@AuthenticationPrincipal CustomUser user) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(myPageService.listAssignableBotsForPicker());
    }

    @PostMapping("/bot/interact")
    public ResponseEntity<BotMenuDTO> interactWithBot(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody BotInteractDTO interactDTO) {
        BotMenuDTO updatedBotInfo = myPageService.interactWithBot(user.getUser().getUserId(), interactDTO.getActionType());
        return ResponseEntity.ok(updatedBotInfo);
    }

    @PatchMapping("/bot/assigned")
    public ResponseEntity<?> setAssignedBot(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody Map<String, Object> body
    ) {
        if (user == null || user.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        Object raw = body != null ? body.get("botId") : null;
        if (raw == null && body != null) {
            raw = body.get("bot_id");
        }
        if (raw == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "botId가 필요해요."));
        }
        long botId;
        try {
            botId = ((Number) raw).longValue();
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "botId 형식이 올바르지 않아요."));
        }
        try {
            return ResponseEntity.ok(myPageService.setAssignedBot(user.getUser().getUserId(), botId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.internalServerError().body(Map.of("message", ex.getMessage()));
        }
    }

    @GetMapping("/letters")
    public ResponseEntity<LetterBoxDTO> getLetters(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(myPageService.getLetterBoxData(user.getUser().getUserId()));
    }

    @PatchMapping("/letters/{letterId}/read")
    public ResponseEntity<Map<String, String>> readLetter(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable("letterId") long letterId) {
        myPageService.markLetterAsRead(user.getUser().getUserId(), letterId);
        return ResponseEntity.ok(Map.of("message", "읽음 처리되었습니다."));
    }

    @DeleteMapping("/letters/{letterId}")
    public ResponseEntity<Map<String, String>> deleteLetter(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable("letterId") long letterId) {
        myPageService.deleteLetter(user.getUser().getUserId(), letterId);
        return ResponseEntity.ok(Map.of("message", "쪽지가 삭제되었습니다."));
    }
    
    /**
     * 상담 ID가 있으면 AI 편지 문구 생성(파이썬 서버). 없으면 빈 응답 — 프론트는 쿼리 없이 호출함.
     */
    @GetMapping("/generate/letters")
    public ResponseEntity<Map<String, Object>> generateLetters(@AuthenticationPrincipal CustomUser user) {
        // 1. 유저 정보가 없는 경우 처리
        if (user == null) {
            System.out.println("로그인 정보가 없습니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 2. ID 추출 (CustomUser 구조에 맞춰서)
        Long loginUserId = user.getUser().getUserId();
        System.out.println("현재 로그인한 유저 ID: " + loginUserId);

        // 3. 서비스 호출
        Map<String, Object> result = myPageService.generateLetterForLatestCounsel(loginUserId);

        if (result == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/settings")
    public ResponseEntity<UserSettingsDTO> getSettings(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(myPageService.getUserSettings(user.getUser().getUserId()));
    }

    @PatchMapping("/settings")
    public ResponseEntity<Map<String, String>> updateSettings(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody SettingUpdateDTO updateDTO) {
        myPageService.updateUserSettings(user.getUser().getUserId(), updateDTO);
        return ResponseEntity.ok(Map.of("message", "설정이 변경되었습니다."));
    }

    @DeleteMapping("/profile")
    public ResponseEntity<Map<String, String>> withdrawAccount(@AuthenticationPrincipal CustomUser user) {
        myPageService.withdrawUser(user.getUser().getUserId());
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다."));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<Map<String, String>> withdrawAccountPost(@AuthenticationPrincipal CustomUser user) {
        myPageService.withdrawUser(user.getUser().getUserId());
        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다."));
    }
}