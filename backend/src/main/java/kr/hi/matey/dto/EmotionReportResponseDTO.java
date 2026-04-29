package kr.hi.matey.dto;

import java.util.Map;
import lombok.Data;

@Data
public class EmotionReportResponseDTO {
    private Map<String, DailyReportDTO> dailyReports;
    private Map<String, BotHistoryReportDTO> botHistoryReports;
}
