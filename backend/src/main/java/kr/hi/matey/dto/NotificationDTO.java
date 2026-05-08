package kr.hi.matey.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private Long notificationId;
    private Long userId;
    private String typeCode;
    private String content;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String targetType;
    private Long targetId;

    // Frontend compatibility fields
    private String type; // system, mate, update (mapped from typeCode)
    private String title;
    private String message;
}
