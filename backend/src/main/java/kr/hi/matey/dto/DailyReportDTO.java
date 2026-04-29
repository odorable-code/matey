package kr.hi.matey.dto;

import java.util.List;
import lombok.Data;

@Data
public class DailyReportDTO {
    private String dateKey;
    private String displayDate;
    private String dominantEmotion;
    private String activeTimeRange;
    private Integer conversationCount;
    private String summaryTitle;
    private String mainConcern;
    private List<String> dominantTopics;
    private List<String> memo;
    private List<TimelineDTO> timeline;
    private List<ChatPreviewDTO> chatPreview;
    
    @Data
    public static class TimelineDTO {
        private Integer id;
        private String title;
        private String description;
    }

    @Data
    public static class ChatPreviewDTO {
        private String id;
        private String role;
        private String name;
        private String time;
        private String text;
    }
}
