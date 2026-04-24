package kr.hi.matey.controller;

import kr.hi.matey.dto.ReportDTO;
import kr.hi.matey.service.ReportService;
import kr.hi.matey.util.CustomUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/mypage/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // 1. 최신 감정 리포트 조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getReports(
            @AuthenticationPrincipal CustomUser user
    ) {
        long userId = user.getUser().getUserId();
        ReportDTO report = reportService.getLatestReport(userId);


        Map<String, Object> response = new HashMap<>();
        response.put("reports", report);

        return ResponseEntity.ok(response);
    }

    // 2. 특정 감정 리포트 상세 조회
    @GetMapping("/detail/{id}")
    public ResponseEntity<Map<String, Object>> getReportDetail(@PathVariable String id) {
        ReportDTO report = reportService.getReportDetail(id);

        Map<String, Object> response = new HashMap<>();
        response.put("report", report);

        return ResponseEntity.ok(response);
    }

    // 3. 감정 리포트 새로고침 (수동 생성)
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshReports(
            @AuthenticationPrincipal CustomUser user
            ) {
        String userId = "test_user_id"; // TODO: 시큐리티 인증 객체에서 실제 유저 ID 추출
        ReportDTO newReport = reportService.generateNewReport(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("reports", newReport);

        return ResponseEntity.ok(response);
    }
}