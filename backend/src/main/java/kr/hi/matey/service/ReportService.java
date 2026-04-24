package kr.hi.matey.service;

import kr.hi.matey.dao.ReportDAO;
import kr.hi.matey.dto.ReportDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportDAO reportDAO;
    private final ObjectMapper objectMapper; // Jackson 라이브러리를 활용한 JSON 파싱

    public ReportDTO getLatestReport(long userId) {
        ReportDTO report = reportDAO.selectLatestReportByUserId(userId);
        if (report != null) {
            parseJsonFields(report);
        }
        return report;
    }

    public ReportDTO getReportDetail(long id) {
        ReportDTO report = reportDAO.selectReportById(id);
        if (report != null) {
            parseJsonFields(report);
        }
        return report;
    }

    public ReportDTO generateNewReport(long userId) {
        // TODO: AI 분석 API 호출 또는 새로운 리포트 통계 생성 후 DB insert 로직 수행

        // 생성 후 최신 리포트를 다시 반환
        return getLatestReport(userId);
    }

    // DB의 Raw 문자열을 List 형태로 파싱
    private void parseJsonFields(ReportDTO dto) {
        try {
            if (dto.getEmotionBarsRaw() != null && !dto.getEmotionBarsRaw().isEmpty()) {
                dto.setEmotionBars(objectMapper.readValue(dto.getEmotionBarsRaw(), new TypeReference<List<Map<String, Object>>>() {}));
            }
            if (dto.getWeeklyFlowRaw() != null && !dto.getWeeklyFlowRaw().isEmpty()) {
                dto.setWeeklyFlow(objectMapper.readValue(dto.getWeeklyFlowRaw(), new TypeReference<List<Map<String, Object>>>() {}));
            }
            if (dto.getKeywordsRaw() != null && !dto.getKeywordsRaw().isEmpty()) {
                dto.setKeywords(Arrays.asList(dto.getKeywordsRaw().split(",")));
            }
        } catch (Exception e) {
            // 파싱 실패 시 로그 처리
            e.printStackTrace();
        }
    }
}