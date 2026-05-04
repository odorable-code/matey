package kr.hi.matey.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentDTO {
    private Long commentId;
    private String content;

    private Long parentCommentId;

    private Integer likeCount;
    private Integer reportCount;

    private Long userId;
    private String userNickname;

    private Long postId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

