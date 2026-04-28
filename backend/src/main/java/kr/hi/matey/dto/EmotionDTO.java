package kr.hi.matey.dto;

import lombok.Data;

@Data
public class EmotionDTO {
    private long userId;
    private String emotion; // 안정, 피로, 불안, 집중, 기쁨, 침잠 등
    private int score;      // 감정 점수 (예: 0 ~ 100)
    private String note;    // 감정과 함께 남긴 짧은 메모나 원인
    private String createdAt;
}