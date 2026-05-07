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
    /** SUPPORT_REASON.target_type (POST/COMMENT이면 신고, NULL이면 일반문의) */
    private String targetType;

    // 사용자 조회 시 마지막 답변만 보여줄 용도
    private String answerContent;
    /** 최신 답변을 남긴 관리자 닉네임 */
    private String answerAdminNickname;
    /** 최신 답변의 처리 방법(관리자 입력) */
    private String answerHandlingMethod;

    private java.time.LocalDateTime createdAt;
}