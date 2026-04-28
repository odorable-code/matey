package kr.hi.matey.dto;

import lombok.Data;

import java.util.List;

@Data
public class HistoryDTO {
    private long historyId;
    private String title;
    private String summary;
    private String mood; // 안정, 기쁨, 불안, 침잠, 피로, 집중 등
    private String date;
    private String createdAt;
    private String counselor;
    private String duration;

    // DB에서 콤마(,)로 구분된 문자열을 받아올 필드
    private String tagsRaw;

    // 프론트엔드로 응답할 때 배열 형태로 보내줄 필드
    private List<String> tags;
}

