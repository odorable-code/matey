package kr.hi.matey.dto;


import lombok.Data;


@Data
public class FaqDTO {
    private Long faqId;
    private String question;
    private String answer;

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}