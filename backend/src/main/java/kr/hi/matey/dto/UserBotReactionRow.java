package kr.hi.matey.dto;

import lombok.Data;

@Data
public class UserBotReactionRow {
    private Long botId;
    /** 1=좋아요, 0=싫어요 */
    private Integer reaction;
}
