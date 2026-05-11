package kr.hi.matey.dto;

import lombok.Data;

@Data
public class WorrySpotlightPublishRequest {
    private Long postId;
    private String answerContent;
}
