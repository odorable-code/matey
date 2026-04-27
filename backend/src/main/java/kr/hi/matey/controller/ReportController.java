package kr.hi.matey.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import kr.hi.matey.dto.ReportDTO;
import kr.hi.matey.service.ReportService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/report")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/reasons")
    public ResponseEntity<?> getReasonList() {
        return ResponseEntity.ok(reportService.getReasonList());
    }

    @PostMapping("/emotion")
    public ResponseEntity<?> createReport(
        @RequestPart("report") ReportDTO reportDTO,
        @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        try {
            reportService.createReport(reportDTO, images);
            return ResponseEntity.ok("접수되었습니다.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}