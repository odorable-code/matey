package kr.hi.matey.dto;

import lombok.Data;

/**
 * 관리자 봇 관리 — BOT 누적 + 전월 BOT_RECOMMEND_EVENT 집계 한 행.
 */
@Data
public class AdminBotStatsRow {
    private Long botId;
    private String name;
    private String displayName;
    private String description;
    /** BOT.selection_preview — 봇 선택 UI 등에 쓰는 한 줄 소개 */
    private String selectionPreview;
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
    private String cardStatsJson;
}
