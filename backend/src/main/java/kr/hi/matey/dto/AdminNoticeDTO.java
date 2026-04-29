package kr.hi.matey.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminNoticeDTO {
    private Long noticeId;
    private String title;
    private String content;

    private Boolean isPublished;
    private LocalDateTime publishedAt;

    private LocalDateTime createdAt;
}

