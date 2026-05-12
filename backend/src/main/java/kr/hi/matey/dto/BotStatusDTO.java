package kr.hi.matey.dto;

import lombok.Data;

import java.util.Date;

@Data
public class BotStatusDTO {
    private int level;
    private int exp;
    /** 먹이 주기로 경험치를 받은 마지막 시각(일 1회 제한 판단용) */
    private Date lastFeedRewardAt;
}