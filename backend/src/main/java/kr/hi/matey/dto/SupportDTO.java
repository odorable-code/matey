package kr.hi.matey.dto;


import lombok.Data;


@Data
public class SupportDTO {
    private Long supportId;
    private Long userId;
    private String title;
    private String content;
    private String status;   // PENDING / DONE 등

    // SUPPORT_REASON 분류
    private Long supportReasonId;
    private String reasonName; // JOIN용

    // 사용자 조회 시 마지막 답변만 보여줄 용도
    private String answerContent;

    private java.time.LocalDateTime createdAt;
}