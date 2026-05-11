package kr.hi.matey.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WorrySpotlightRow {
    private Long postId;
    private String answerContent;
    private LocalDateTime updatedAt;
    private String answeredByNickname;
}
