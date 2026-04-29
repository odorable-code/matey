package kr.hi.matey.dto;

import lombok.Data;

@Data
public class PostCreateRequestDTO {
    private Long postId; // insert 후 selectKey로 채워짐
    private String title;
    private String content;
    private Long categoryId;
}

