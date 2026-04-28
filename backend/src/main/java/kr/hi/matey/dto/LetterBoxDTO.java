package kr.hi.matey.dto;
import lombok.Data;
import java.util.List;

@Data
public class LetterBoxDTO {
    private int unreadCount;
    private int weeklyCount;
    private List<LetterDTO> items;

    @Data
    public static class LetterDTO {
        private long id;
        private String type;
        private String sender;
        private String title;
        private String preview;
        private String date;
        private boolean unread;
    }
}
