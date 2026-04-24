package kr.hi.matey.dto;


import lombok.Data;


@Data
public class SupportDTO {
    private long supportId;
    private long userId;
    private String title;
    private String content;
    private String status;   // 접수됨, 검토중, 답변 완료, 해결됨 등
    private String category; // 일반 문의, 결제 문의, 오류 신고 등
    private String email;    // 답변 받을 이메일
    private String createdAt;
    private String updatedAt;
}