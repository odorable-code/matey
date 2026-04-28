package kr.hi.matey.controller;


import kr.hi.matey.dto.EmotionDTO;
import kr.hi.matey.service.EmotionService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage/emotions") // 프론트엔드 라우팅에 맞춰 /api/emotion/history 등으로 변경 가능
@RequiredArgsConstructor
public class EmotionController {

    private final EmotionService emotionService;

    // 감정 내역 리스트 조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getEmotionHistory(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();

        List<EmotionDTO> emotions = emotionService.getEmotionHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("emotions", emotions);
        response.put("totalCount", emotions.size());

        return ResponseEntity.ok(response);
    }

    // (선택) 새로운 감정 기록 추가 API
    @PostMapping
    public ResponseEntity<Map<String, Object>> addEmotionLog(
         @RequestBody EmotionDTO emotionDTO,
        @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();
        emotionDTO.setUserId(userId);

        emotionService.addEmotionLog(emotionDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "감정이 기록되었습니다.");
        response.put("item", emotionDTO);

        return ResponseEntity.ok(response);
    }
}