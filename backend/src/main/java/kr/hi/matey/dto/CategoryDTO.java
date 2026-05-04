package kr.hi.matey.dto;

import lombok.Data;

@Data
public class CategoryDTO {
    private Long categoryId;
    private String name;
    /**
     * DB CATEGORY.notification — 1이면 일반 회원도 글 작성 가능, 0이면 공지 등(관리자만 작성).
     */
    private Integer notification;
}

