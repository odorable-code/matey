package kr.hi.matey.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostDTO {
    private Long postId;
    private String title;
    private String content;

    private Integer likeCount;
    private Integer dislikeCount;
    /** 로그인 사용자 기준, 해당 게시글에 좋아요를 눌렀는지 */
    private Boolean likedByMe;
    private Integer reportCount;
    private Integer viewCount;

    private Long userId;
    private String userNickname;

    private Long categoryId;
    private String categoryName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

