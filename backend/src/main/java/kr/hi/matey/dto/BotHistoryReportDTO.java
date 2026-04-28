package kr.hi.matey.dto;

import java.util.List;
import lombok.Data;

@Data
public class BotHistoryReportDTO {
    private String toneLabel;
    private String summary;
    private String feedbackTitle;
    private String feedbackBody;
    private List<String> actionTips;
    private List<MeterDTO> meters;

    @Data
    public static class MeterDTO {
        private String label;
        private Integer value;
    }
}
