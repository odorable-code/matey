package kr.hi.matey.dto;

import lombok.Data;

/**
 * 관리자 상담봇 등록·수정용 (BOT 테이블).
 * {@code insertBot} 시 {@code botId}는 useGeneratedKeys 로 채워집니다.
 */
@Data
public class AdminBotUpsertDTO {
    private Long botId;
    private String name;
    /** BOT.display_name — 사용자에게 보이는 이름 */
    private String displayName;
    private String avatarImage;
    private String description;
    private String selectionPreview;
    /** 메인 홈 카드 능력치 4개 JSON */
    private String cardStatsJson;
}
