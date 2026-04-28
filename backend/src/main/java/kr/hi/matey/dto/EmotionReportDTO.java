package kr.hi.matey.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EmotionReportDTO {
    private Long analysisId;
    private Long messageId;
    private Long dominantEmotionId;
    private Integer riskLevel;
    private Boolean isHighRisk;
    private String recommendedAction;
    private LocalDateTime analyzedAt;
}
