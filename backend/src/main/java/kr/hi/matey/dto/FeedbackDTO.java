package kr.hi.matey.dto;

import lombok.Data;

import java.time.LocalDateTime;

/* FeedbackDTO.java (SUPPORT 테이블 기반) */
@Data
public class FeedbackDTO {
    private Long supportId;
    private Long userId;
    private String userNickname; // JOIN
    private String title;
    private String content;
    private String status; // PENDING / DONE
    private String reasonName; // SUPPORT_REASON JOIN
    private LocalDateTime createdAt;
}
