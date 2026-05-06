package kr.hi.matey.dto;

import java.time.LocalDateTime;

import lombok.Data;

/** 공지 페이지 통합 피드: 운영 공지(ADMIN_NOTICE) + 공지·이벤트 카테고리 게시글 */
@Data
public class NoticeFeedItemDTO {

    /** {@code ADMIN_NOTICE} | {@code POST} */
    private String itemType;

    private Long noticeId;
    private Long postId;

    /** 예: 공지, 이벤트 */
    private String badge;

    private String title;
    private String content;

    private LocalDateTime publishedAt;
}
