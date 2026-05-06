package kr.hi.matey.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class BotYearRankingDTO {
    private Integer ranking;
    private Long botId;
    private String name;
    private String avatarImage;
    private BigDecimal popularityScore;
    private Integer statYear;
}
