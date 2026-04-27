package kr.hi.matey.controller;

import kr.hi.matey.dto.*;
import kr.hi.matey.service.MyPageService;
import kr.hi.matey.util.CustomUser; // 기존 사용하시던 시큐리티 객체 가정
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

    @PostMapping("/bot/interact")
    public ResponseEntity<BotMenuDTO> interactWithBot(
            @AuthenticationPrincipal CustomUser user,
            @RequestBody BotInteractDTO interactDTO) {
        // 상호작용 후 업데이트된 봇 정보를 다시 반환
        BotMenuDTO updatedBotInfo = myPageService.interactWithBot(user.getUser().getUserId(), interactDTO.getActionType());
        return ResponseEntity.ok(updatedBotInfo);
    }

    @GetMapping("/letters")
    public ResponseEntity<LetterBoxDTO> getLetters(@AuthenticationPrincipal CustomUser user) {
        return ResponseEntity.ok(myPageService.getLetterBoxData(user.getUser().getUserId()));
    }

    @PatchMapping("/letters/{letterId}/read")
    public ResponseEntity<Map<String, String>> readLetter(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable long letterId) {
        myPageService.markLetterAsRead(user.getUser().getUserId(), letterId);
        return ResponseEntity.ok(Map.of("message", "읽음 처리되었습니다."));
    }

    @DeleteMapping("/letters/{letterId}")
    public ResponseEntity<Map<String, String>> deleteLetter(
            @AuthenticationPrincipal CustomUser user,
            @PathVariable long letterId) {
        myPageService.deleteLetter(user.getUser().getUserId(), letterId);
        return ResponseEntity.ok(Map.of("message", "쪽지가 삭제되었습니다."));
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
}