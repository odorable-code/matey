package kr.hi.matey.controller;

import kr.hi.matey.dto.HistoryDTO;
import kr.hi.matey.service.HistoryService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;

    // 1. 상담 내역 리스트 조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getHistoryList(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();

        List<HistoryDTO> historyList = historyService.getHistoryList(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("history", historyList);
        response.put("items", historyList); // 프론트엔드 호환성을 위해 items 키도 제공
        response.put("totalCount", historyList.size());

        return ResponseEntity.ok(response);
    }

    // 2. 특정 상담 내역 상세 조회
    @GetMapping("/detail/{id}")
    public ResponseEntity<Map<String, Object>> getHistoryDetail(@PathVariable long historyId) {
        HistoryDTO historyDetail = historyService.getHistoryDetail(historyId);

        Map<String, Object> response = new HashMap<>();
        response.put("item", historyDetail);

        return ResponseEntity.ok(response);
    }
}