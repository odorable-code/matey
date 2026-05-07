package kr.hi.matey.controller;


import kr.hi.matey.dto.FaqDTO;
import kr.hi.matey.dto.SupportDTO;
import kr.hi.matey.service.SupportService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    // 1. 나의 문의 내역 리스트 조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSupportHistory(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();


        List<SupportDTO> supportList = supportService.getSupportList(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("items", supportList);
        response.put("totalCount", supportList.size());

        return ResponseEntity.ok(response);
    }

    // 2. 새 문의 등록
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSupportTicket(
            @RequestBody SupportDTO supportDTO,
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();
        supportDTO.setUserId(userId);

        supportService.createSupportTicket(supportDTO);

        Map<String, Object> response = new HashMap<>();
        response.put("item", supportDTO); // 등록 성공 후 생성된 객체 반환

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{supportId}")
    public ResponseEntity<Void> deleteSupportTicket(
            @PathVariable Long supportId,
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();
        supportService.deleteOwnSupportTicket(userId, supportId);
        return ResponseEntity.noContent().build();
    }

    // 3. 자주 묻는 질문(FAQ) 리스트 조회
    @GetMapping("/faq")
    public ResponseEntity<Map<String, Object>> getFaqList() {
        List<FaqDTO> faqList = supportService.getFaqList();

        Map<String, Object> response = new HashMap<>();
        response.put("faq", faqList);

        return ResponseEntity.ok(response);
    }

    // 4. 문의/신고 분류(Reason) 리스트 조회
    @GetMapping("/reasons")
    public ResponseEntity<Map<String, Object>> getSupportReasons() {
        List<kr.hi.matey.dto.SupportReasonDTO> reasons = supportService.getSupportReasons();
        return ResponseEntity.ok(Map.of("reasons", reasons));
    }
}