package kr.hi.matey.dto;

import lombok.Data;

@Data
public class CommentCreateRequestDTO {
    private String content;
    private Long parentCommentId; // null이면 댓글(루트)
}

