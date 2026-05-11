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
    
    @GetMapping("/generate/letters")
    public ResponseEntity<Map<String, String>> generateLetters(@PathVariable Long counselId) {
        String message = myPageService.letterMessage(counselId);
        
        Map<String, String> result = new HashMap<>();
        result.put("message", message);
        
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