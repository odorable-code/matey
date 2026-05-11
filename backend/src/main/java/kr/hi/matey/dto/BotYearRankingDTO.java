package kr.hi.matey.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BotYearRankingDTO {
    private Integer ranking;
    private Long botId;
    private String name;
    private String avatarImage;
    private String description;
    private Integer likeCount;
    private BigDecimal popularityScore;
    private Integer statYear;
    /** 월간 랭킹 등에서 사용 (1–12) */
    private Integer statMonth;
}
