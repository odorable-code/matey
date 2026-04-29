package kr.hi.matey.controller;

import kr.hi.matey.dto.EmotionReportDTO;
import kr.hi.matey.dto.EmotionReportResponseDTO;
import kr.hi.matey.service.EmotionReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/emotion-report")
public class EmotionReportController {

    private final EmotionReportService emotionReportService;

    // --- Dashboard 통계용 (기존) ---
    @GetMapping("/dashboard")
    public ResponseEntity<EmotionReportResponseDTO> getEmotionReportDashboard() {
        // TODO: JWT 등 인증 모듈 연동 후 SecurityContext에서 실제 userId를 가져오도록 수정
        Long userId = 1L; 
        EmotionReportResponseDTO data = emotionReportService.getEmotionReportData(userId);
        return ResponseEntity.ok(data);
    }

    // --- CRUD Operations ---

    // Create
    @PostMapping
    public ResponseEntity<EmotionReportDTO> createReport(@RequestBody EmotionReportDTO dto) {
        EmotionReportDTO created = emotionReportService.createReport(dto);
        return ResponseEntity.ok(created);
    }

    // Read (List)
    @GetMapping
    public ResponseEntity<List<EmotionReportDTO>> getReportList() {
        Long userId = 1L; // TODO: SecurityContext
        List<EmotionReportDTO> list = emotionReportService.getReportList(userId);
        return ResponseEntity.ok(list);
    }

    // Read (Detail)
    @GetMapping("/{analysisId}")
    public ResponseEntity<EmotionReportDTO> getReportDetail(@PathVariable Long analysisId) {
        EmotionReportDTO dto = emotionReportService.getReportDetail(analysisId);
        return ResponseEntity.ok(dto);
    }

    // Update
    @PutMapping("/{analysisId}")
    public ResponseEntity<String> updateReport(
            @PathVariable Long analysisId, 
            @RequestBody EmotionReportDTO dto
    ) {
        emotionReportService.updateReport(analysisId, dto);
        return ResponseEntity.ok("수정되었습니다.");
    }

    // Delete
    @DeleteMapping("/{analysisId}")
    public ResponseEntity<String> deleteReport(@PathVariable Long analysisId) {
        emotionReportService.deleteReport(analysisId);
        return ResponseEntity.ok("삭제되었습니다.");
    }
}
