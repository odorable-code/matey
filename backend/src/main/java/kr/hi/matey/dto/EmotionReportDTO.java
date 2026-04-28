package kr.hi.matey.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class EmotionReportDTO {
    private long reportId;
    private int stability;
    private String dominantEmotion;
    private String rangeLabel;
    private String createdAt;
    private String updatedAt;

    // DB에서 JSON 형태의 문자열을 그대로 받아올 필드
    private String emotionBarsRaw;
    private String weeklyFlowRaw;
    private String keywordsRaw;

    // 프론트엔드로 응답할 때 사용하는 파싱된 데이터 구조
    private List<Map<String, Object>> emotionBars;
    private List<Map<String, Object>> weeklyFlow;
    private List<String> keywords;
}