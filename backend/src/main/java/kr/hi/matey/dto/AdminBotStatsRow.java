package kr.hi.matey.dto;

import lombok.Data;

/**
 * 관리자 봇 관리 — BOT 누적 + 전월 BOT_RECOMMEND_EVENT 집계 한 행.
 */
@Data
public class AdminBotStatsRow {
    private Long botId;
    private String name;
    private String description;
    private String avatarImage;
    /** BOT.like_count */
    private Integer likeCount;
    /** BOT.dislike_count */
    private Integer dislikeCount;
    /** 해당 월 SUM(delta) */
    private Integer prevMonthNet;
    /** 해당 월 delta=1 건수 */
    private Integer prevMonthRecommendCount;
    /** 해당 월 delta=-1 건수 */
    private Integer prevMonthDislikeCount;
}
