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
}
