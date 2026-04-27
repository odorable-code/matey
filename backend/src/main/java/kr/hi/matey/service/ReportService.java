package kr.hi.matey.service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import kr.hi.matey.dao.ReportDAO;
import kr.hi.matey.dto.ReportDTO;
import kr.hi.matey.dto.ReportReasonDTO;
import kr.hi.matey.util.SupportType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportDAO reportDAO;

    private final String uploadDir = "C:/matey-upload/support/";

    public List<ReportReasonDTO> getReasonList() {
        return reportDAO.selectReasonList();
    }

    @Transactional
    public void createReport(ReportDTO reportDTO, List<MultipartFile> images) {
        if (reportDTO == null) {
            throw new IllegalArgumentException("요청 정보가 없습니다.");
        }

        if (reportDTO.getType() == null) {
            reportDTO.setType(SupportType.REPORT);
        }

        validateReport(reportDTO);

        reportDAO.insertReport(reportDTO);

        saveImages(reportDTO.getSupportId(), images);
    }

    private void validateReport(ReportDTO reportDTO) {
        if (reportDTO.getUserId() == null) {
            throw new IllegalArgumentException("사용자 정보가 없습니다.");
        }

        if (reportDTO.getContent() == null || reportDTO.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("내용을 입력하세요.");
        }

        if (reportDTO.getType() == SupportType.INQUIRY) {
            return;
        }

        if (reportDTO.getReason() == null) {
            throw new IllegalArgumentException("신고목록을 입력하세요.");
        }

        if (reportDAO.existsReason(reportDTO.getReason()) == 0) {
            throw new IllegalArgumentException("존재하지 않는 신고목록입니다.");
        }

        if (reportDTO.getTargetType() == null) {
            throw new IllegalArgumentException("신고 대상이 없습니다.");
        }

        if (reportDTO.getTargetId() == null) {
            throw new IllegalArgumentException("신고 대상 번호가 없습니다.");
        }

    }

    private void saveImages(Long supportId, List<MultipartFile> images) {

        if (images == null || images.isEmpty()) {
            return;
        }

        File dir = new File(uploadDir);

        if (!dir.exists()) {
            dir.mkdirs();
        }

        for (MultipartFile image : images) {

            if (image.isEmpty()) {
                continue;
            }

            String originalName = image.getOriginalFilename();
            String extension = "";

            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }

            String savedName = UUID.randomUUID() + extension;
            File savedFile = new File(uploadDir + savedName);

            try {
                image.transferTo(savedFile);

                String imageUrl = "/uploads/support/" + savedName;

                reportDAO.insertReportImage(supportId, imageUrl);

            } catch (IOException e) {
                throw new RuntimeException("이미지 저장에 실패했습니다.");
            }
        }
    }
}