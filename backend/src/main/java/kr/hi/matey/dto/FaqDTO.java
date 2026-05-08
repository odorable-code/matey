package kr.hi.matey.dto;


import lombok.Data;


@Data
public class FaqDTO {
    private Long faqId;
    /** ADMIN_FAQ.role_id — 작성자 역할 (DB 스키마 필수) */
    private Long roleId;
    private String question;
    private String answer;

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}